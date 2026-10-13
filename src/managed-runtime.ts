/** Profile-owned SearXNG lifecycle using public DSH subprocess handles. */
import { randomBytes } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import lockfile from 'proper-lockfile'
import type { SubprocessRuntime, SubprocessHandle } from '@deepseek-ai/dsh-subprocess'
import { prepareRuntime, runtimeIsPrepared, runtimeSetupInfo, uvAsset, RuntimeSetupRequired, type PreparedRuntime, type RuntimeCommand, type RuntimeRecorder } from './runtime-installer.ts'
import type { RuntimeActivity, ServiceStatus } from './runtime-types.ts'
import { redactRuntimeLog } from './runtime-log.ts'

export interface ManagedOptions {
  port: number
  setupTimeoutMs: number
  startupTimeoutMs: number
  restartLimit: number
}

const SERVER = `import socket, sys, json, os
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(('127.0.0.1', int(sys.argv[1])))
sock.listen(128)
from searx.webapp import app
from waitress import serve
print('DSH_SEARXNG_READY ' + json.dumps({'port': sock.getsockname()[1]}), flush=True)
serve(app, sockets=[sock], threads=4)
`

/** One manager owns one profile lock, subprocess range, and bounded log. */
export class ManagedRuntime {
  private state: ServiceStatus = { phase: 'idle', endpoint: '', message: '', logs: '' }
  private controller: AbortController | undefined
  private operation: Promise<void> = Promise.resolve()
  private child: SubprocessHandle | undefined
  private release: (() => Promise<void>) | undefined
  private disposed = false
  private options: ManagedOptions | undefined
  private attempts = 0
  private setupApproved = false
  private cached = false
  private readonly activities: RuntimeActivity[] = []
  private readonly secrets: string[] = []

  constructor(
    private readonly directory: string,
    private readonly subprocess: Pick<SubprocessRuntime, 'spawn'>,
    private readonly prepare = prepareRuntime,
    private readonly isPrepared = runtimeIsPrepared,
  ) {}

  /** Current immutable snapshot, including recent child output. */
  status(): ServiceStatus {
    const output = this.child ? this.output(this.child) : ''
    return { ...this.state, logs: this.redact(`${this.state.logs}\n${output}`).trim().slice(-12000),
      setup: runtimeSetupInfo(this.directory, this.cached), activities: [...this.activities] }
  }

  private redact(text: string): string { return redactRuntimeLog(text, this.directory, this.secrets) }

  /** Append safe structured events across starts and stops during this DSH run. */
  readonly record: RuntimeRecorder = event => {
    this.activities.push({ ...event, subject: this.redact(event.subject).slice(0, 200), detail: this.redact(event.detail).slice(0, 3000), time: new Date().toISOString() })
    if (this.activities.length > 100) this.activities.shift()
  }

  /** Serialize configuration changes, cancelling preparation or startup already in progress. */
  start(options: ManagedOptions, approveSetup = false): Promise<void> {
    if (approveSetup) this.setupApproved = true
    this.options = options
    this.attempts = 0
    this.controller?.abort()
    const controller = new AbortController()
    this.controller = controller
    this.operation = this.operation.catch(() => {}).then(async () => {
      await this.stopChild()
      if (this.disposed || controller.signal.aborted) return
      try { await this.launch(options, controller.signal) }
      catch (error) {
        await this.stopChild()
        if (!controller.signal.aborted) {
          const required = error instanceof RuntimeSetupRequired
          const message = required ? '' : this.redact(error instanceof Error ? error.message : String(error))
          this.state = { ...this.state, phase: required ? 'needs-setup' : 'failed', endpoint: '', message }
          if (!required) this.record({ kind: 'error', subject: 'SearXNG', detail: message })
        }
      }
    })
    return this.operation
  }

  /** Stop only this manager's process; the cached runtime and preferences remain. */
  stop(): Promise<void> {
    this.options = undefined
    this.controller?.abort()
    this.operation = this.operation.catch(() => {}).then(async () => {
      await this.stopChild()
      this.state = { ...this.state, phase: 'stopped', endpoint: '', message: '' }
    })
    return this.operation
  }

  /** Delete only generated runtime contents while holding the profile ownership lock. */
  cleanup(): Promise<void> {
    this.options = undefined
    this.setupApproved = false
    this.controller?.abort()
    this.operation = this.operation.catch(() => {}).then(async () => {
      await this.stopChild()
      this.state = { ...this.state, phase: 'stopped', endpoint: '', message: '' }
      try {
        let directoryInfo
        try { directoryInfo = await lstat(this.directory) }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
        if (directoryInfo) {
          if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) throw new Error('Refusing to clean a redirected runtime directory')
          const release = await lockfile.lock(this.directory, { realpath: false, stale: 60000, update: 10000 })
          try {
            const entries = await readdir(this.directory)
            for (const entry of entries) {
              if (['python', 'uv-cache', 'secret', 'settings.yml', 'serve.py'].includes(entry)
                || /^runtime-[a-f0-9]{12}-\d+\.\d+\.\d+-\d+\.\d+\.\d+$/.test(entry)) {
                await rm(join(this.directory, entry), { recursive: true, force: true })
              }
            }
          } finally { await release() }
        }
        this.cached = false
        this.secrets.length = 0
        this.state = { phase: 'needs-setup', endpoint: '', message: '', logs: '' }
        this.record({ kind: 'cleanup', subject: 'SearXNG', detail: this.directory })
      } catch (error) {
        const message = this.redact(error instanceof Error ? error.message : String(error))
        this.state = { ...this.state, phase: 'failed', message }
        this.record({ kind: 'error', subject: 'SearXNG cleanup', detail: message })
      }
    })
    return this.operation
  }

  /** Cancel setup and await complete subprocess teardown before releasing ownership. */
  async dispose(): Promise<void> {
    this.disposed = true
    await this.stop()
  }

  private output(child: SubprocessHandle): string {
    return this.redact([child.collected.stdout?.readFrom(0).text, child.collected.stderr?.readFrom(0).text].filter(Boolean).join('\n')).slice(-12000)
  }

  private spawn(argv: string[], cwd: string, env: Record<string, string>, signal: AbortSignal): SubprocessHandle {
    this.record({ kind: 'command', subject: 'argv', detail: argv.map(arg => JSON.stringify(arg)).join(' ') })
    return this.subprocess.spawn({ argv, cwd, env, signal, graceMs: 3000,
      stdio: { stdin: 'ignore', stdout: { maxBytes: 16000 }, stderr: { maxBytes: 16000 } } })
  }

  private async launch(options: ManagedOptions, signal: AbortSignal): Promise<void> {
    uvAsset(process.platform, process.arch)
    this.cached = await this.isPrepared(this.directory)
    signal.throwIfAborted()
    if (!this.cached && !this.setupApproved) {
      this.state = { phase: 'needs-setup', endpoint: '', message: '', logs: '' }
      return
    }
    this.state = { phase: 'preparing', endpoint: '', message: '', logs: '' }
    await mkdir(this.directory, { recursive: true, mode: 0o700 })
    this.release = await lockfile.lock(this.directory, { realpath: false, stale: 60000, update: 10000,
      onCompromised: error => { this.state = { ...this.state, phase: 'failed', message: error.message }; this.controller?.abort() } })
    const setupSignal = AbortSignal.any([signal, AbortSignal.timeout(options.setupTimeoutMs)])
    const command: RuntimeCommand = async (argv, cwd, env, commandSignal) => {
      const child = this.spawn(argv, cwd, env, commandSignal)
      this.child = child
      try {
        const result = await child.done
        this.state.logs = `${this.state.logs}\n${this.output(child)}`.slice(-12000)
        commandSignal.throwIfAborted()
        if (result.exitCode !== 0) throw new Error(`Runtime setup failed (${result.exitCode}): ${this.output(child)}`)
      } finally {
        child.terminate()
        await child.waitForExit()
        if (this.child === child) this.child = undefined
      }
    }
    const runtime: PreparedRuntime = await this.prepare(this.directory, command, setupSignal, message => { this.state.message = message }, this.record, this.setupApproved)
    this.cached = true
    signal.throwIfAborted()
    const secretPath = join(this.directory, 'secret')
    let secret: string
    try { secret = await readFile(secretPath, 'utf8') }
    catch { secret = randomBytes(32).toString('hex'); await writeFile(secretPath, secret, { mode: 0o600 }) }
    this.secrets.push(secret.trim())
    const settings = join(this.directory, 'settings.yml')
    await writeFile(settings, `use_default_settings: true\nserver:\n  secret_key: ${JSON.stringify(secret)}\n  bind_address: 127.0.0.1\n  limiter: false\nsearch:\n  formats: [html, json]\n`, { mode: 0o600 })
    const script = join(this.directory, 'serve.py')
    await writeFile(script, SERVER)
    this.record({ kind: 'configure', subject: 'SearXNG', detail: `${settings}\n${script}\n127.0.0.1 / JSON` })
    this.state = { ...this.state, phase: 'starting', message: '' }
    const child = this.spawn([runtime.python, '-u', script, String(options.port)], runtime.source,
      { SEARXNG_SETTINGS_PATH: settings, PYTHONPATH: runtime.source, PYTHONUNBUFFERED: '1' }, signal)
    this.child = child
    let exited = false
    let failure = ''
    const onExit = (reason: string) => {
      exited = true
      failure = reason
      if (this.child === child && this.state.phase === 'ready' && !signal.aborted && !this.disposed) {
        this.state = { ...this.state, phase: 'failed', endpoint: '', message: failure }
        if (this.options && this.attempts++ < this.options.restartLimit) this.restartAfterExit(this.options)
      }
    }
    void child.done.then(result => { onExit(`SearXNG exited (${result.exitCode}): ${this.output(child)}`) }, error => { onExit(String(error)) })
    const startupSignal = AbortSignal.any([signal, AbortSignal.timeout(options.startupTimeoutMs)])
    while (true) {
      startupSignal.throwIfAborted()
      if (exited) throw new Error(failure)
      const line = child.collected.stdout?.readFrom(0).text.match(/DSH_SEARXNG_READY (\{[^\n]+\})/)
      if (line) {
        const port = JSON.parse(line[1]!).port
        if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid managed SearXNG port')
        const endpoint = `http://127.0.0.1:${port}`
        try {
          const health = await fetch(`${endpoint}/config`, { redirect: 'error', signal: AbortSignal.any([startupSignal, AbortSignal.timeout(1500)]) })
          const config: unknown = await health.json()
          if (health.ok && typeof config === 'object' && config !== null && Array.isArray(Reflect.get(config, 'engines'))) {
            this.state = { ...this.state, phase: 'ready', endpoint, message: '' }
            this.record({ kind: 'ready', subject: 'SearXNG', detail: `${endpoint}/config / HTTP ${health.status}` })
            return
          }
        } catch { startupSignal.throwIfAborted() }
      }
      await delay(250, undefined, { signal: startupSignal })
    }
  }

  private restartAfterExit(options: ManagedOptions): void {
    this.operation = this.operation.catch(() => {}).then(async () => {
      await this.stopChild()
      if (this.disposed || this.options !== options) return
      this.controller = new AbortController()
      try { await this.launch(options, this.controller.signal) }
      catch (error) {
        await this.stopChild()
        const required = error instanceof RuntimeSetupRequired
        this.state = { ...this.state, phase: required ? 'needs-setup' : 'failed', endpoint: '', message: required ? '' : this.redact(String(error)) }
      }
    })
  }

  private async stopChild(): Promise<void> {
    const child = this.child
    this.child = undefined
    if (child) {
      this.state.logs = `${this.state.logs}\n${this.output(child)}`.slice(-12000)
      child.terminate(); await child.waitForExit()
      this.record({ kind: 'stop', subject: 'SearXNG', detail: '' })
    }
    const release = this.release
    this.release = undefined
    await release?.()
  }
}
