/** Small profile-owned JSONL journal. Logging failures never stop search or lifecycle cleanup. */
import { constants } from 'node:fs'
import { appendFile, chmod, lstat, mkdir, open, readFile, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import lockfile from 'proper-lockfile'
import { redactRuntimeLog } from './runtime-log.ts'
import type { RuntimeActivity, RuntimeLogStorage } from './runtime-types.ts'

export const RUNTIME_LOG_FILE_BYTES = 128 * 1024
export const RUNTIME_LOG_MAX_BYTES = RUNTIME_LOG_FILE_BYTES * 2
const NAMES = ['runtime.jsonl', 'runtime.1.jsonl'] as const
const KINDS: RuntimeActivity['kind'][] = ['download', 'verify', 'extract', 'command', 'cache', 'configure', 'ready', 'stop', 'cleanup', 'test', 'error']

export class RuntimeJournal {
  private readonly directory: string
  private events: RuntimeActivity[] = []
  private tail: Promise<void> = Promise.resolve()
  private queuedBytes = 0
  private bytes = 0
  private failed = false
  private generation = 0

  constructor(private readonly runtimeDirectory: string) {
    this.directory = join(runtimeDirectory, 'logs')
    const generation = this.generation
    void this.enqueue(async () => {
      await this.withLock(false, async () => {
        const saved: RuntimeActivity[] = []
        for (const name of [...NAMES].reverse()) {
          const file = join(this.directory, name)
          if (!await this.size(file)) continue
          for (const line of (await readFile(file, 'utf8')).split('\n')) {
            try {
              const value: unknown = JSON.parse(line)
              if (!value || typeof value !== 'object') continue
              const event = value as RuntimeActivity
              if (!KINDS.includes(event.kind) || typeof event.subject !== 'string' || typeof event.detail !== 'string'
                || typeof event.time !== 'string' || !Number.isFinite(Date.parse(event.time))) continue
              saved.push(this.safe(event))
              if (saved.length > 100) saved.shift()
            } catch { /* Ignore partial or malformed records after an interrupted write. */ }
          }
        }
        if (generation === this.generation) this.events = [...saved, ...this.events].slice(-100)
        await this.measure()
      })
    }).catch(() => {})
  }

  activities(): RuntimeActivity[] { return this.events.map(event => ({ ...event })) }
  storage(): RuntimeLogStorage { return { bytes: this.bytes, maxBytes: RUNTIME_LOG_MAX_BYTES, failed: this.failed } }
  async flush(): Promise<void> { await this.tail }

  record(event: RuntimeActivity): void {
    const safe = this.safe(event)
    this.events.push(safe)
    if (this.events.length > 100) this.events.shift()
    // A leading newline isolates any partial record left by an interrupted previous write.
    const line = '\n' + JSON.stringify(safe) + '\n'
    const bytes = Buffer.byteLength(line)
    // Keep pending writes bounded too; a burst can retain its newest records in memory.
    if (this.queuedBytes + bytes > RUNTIME_LOG_MAX_BYTES) return
    this.queuedBytes += bytes
    void this.enqueue(async () => {
      try {
        await this.withLock(true, async () => {
          const current = join(this.directory, NAMES[0]), previous = join(this.directory, NAMES[1])
          await this.size(previous)
          if (await this.size(current) + bytes > RUNTIME_LOG_FILE_BYTES) {
            await rm(previous, { force: true })
            await rename(current, previous)
          }
          await appendFile(current, line, { mode: 0o600,
            flag: constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0) })
          await chmod(current, 0o600)
          await this.measure()
          this.failed = false
        })
      } finally { this.queuedBytes -= bytes }
    }).catch(() => {})
  }

  /** Serialize deletion with earlier and later writes; new events remain usable after clearing. */
  clear(): Promise<void> {
    this.generation++
    this.events = []
    return this.enqueue(async () => {
      await this.withLock(false, async () => {
        for (const name of NAMES) {
          const file = join(this.directory, name)
          await this.size(file)
          await rm(file, { force: true })
        }
      })
      this.bytes = 0
      this.failed = false
    }).catch(() => { throw new Error('Could not clear saved runtime records') })
  }

  private safe(event: RuntimeActivity): RuntimeActivity {
    const clean = (value: string, limit: number) => redactRuntimeLog(value, this.runtimeDirectory)
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, limit)
    // Child output can contain request content. Persist only the first error-summary line.
    const detail = event.kind === 'error' ? event.detail.split(/\r?\n/, 1)[0] ?? '' : event.detail
    return { time: new Date(event.time).toISOString(), kind: event.kind, subject: clean(event.subject, 200), detail: clean(detail, 3000) }
  }

  private enqueue(operation: () => Promise<void>): Promise<void> {
    const next = this.tail.then(operation)
    this.tail = next.catch(() => { this.failed = true })
    return next
  }

  /** Refuse redirected roots/files; only these two plugin-owned names may be modified. */
  private async withLock(create: boolean, operation: () => Promise<void>): Promise<void> {
    for (const directory of [this.runtimeDirectory, this.directory]) {
      let info
      try { info = await lstat(directory) }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        if (!create) return
        await mkdir(directory, { recursive: true, mode: 0o700 })
        info = await lstat(directory)
      }
      if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Redirected runtime log directory')
    }
    const release = await lockfile.lock(this.directory, { realpath: false, retries: { retries: 5, minTimeout: 10, maxTimeout: 50 } })
    try { await operation() }
    finally { await release() }
  }

  private async size(file: string): Promise<number> {
    let info
    try { info = await lstat(file) }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0; throw error }
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) throw new Error('Redirected runtime log file')
    if (info.size > RUNTIME_LOG_FILE_BYTES) {
      // Explicit descriptor truncation also works on Windows; do not rely on an empty write.
      const handle = await open(file, constants.O_RDWR | (constants.O_NOFOLLOW ?? 0))
      try {
        const opened = await handle.stat()
        if (!opened.isFile() || opened.nlink !== 1 || opened.dev !== info.dev || opened.ino !== info.ino) throw new Error('Redirected runtime log file')
        await handle.truncate(0)
      } finally { await handle.close() }
      return 0
    }
    return info.size
  }

  private async measure(): Promise<void> {
    this.bytes = await this.size(join(this.directory, NAMES[0])) + await this.size(join(this.directory, NAMES[1]))
  }
}
