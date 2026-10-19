import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { SubprocessHandle, SubprocessOutcome, SubprocessSpawnSpec } from '@deepseek-ai/dsh-subprocess'
import { ManagedRuntime } from '../src/managed-runtime.ts'
import type { PreparedRuntime, prepareRuntime } from '../src/runtime-installer.ts'

const directories: string[] = []
const managers: ManagedRuntime[] = []
const options = { port: 0, setupTimeoutMs: 3000, startupTimeoutMs: 2000, restartLimit: 1 }
afterEach(async () => { for (const m of managers.splice(0)) await m.dispose(); for (const d of directories.splice(0)) await rm(d, { recursive: true, force: true }); vi.unstubAllGlobals() })

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'searxng-managed-')); directories.push(dir)
  const children: (SubprocessHandle & { exit: (outcome?: SubprocessOutcome) => void; terminated: boolean })[] = []
  const spawn = vi.fn((_spec: SubprocessSpawnSpec) => {
    let resolve!: (value: SubprocessOutcome) => void
    const done = new Promise<SubprocessOutcome>(r => { resolve = r })
    const child = {
      stdin: undefined, stdout: undefined, stderr: undefined, control: undefined,
      collected: { stdout: { readFrom: () => ({ text: 'DSH_SEARXNG_READY {"port":12345}\n', nextOffset: 40, lossy: false }) } },
      done, terminated: false,
      terminate() { this.terminated = true; resolve({ exitCode: null, signal: 'SIGTERM' }) },
      async waitForExit() { await done; return true },
      exit(outcome = { exitCode: 1, signal: null } as SubprocessOutcome) { resolve(outcome) },
    }
    children.push(child)
    return child
  })
  const prepare = vi.fn<typeof prepareRuntime>(async (): Promise<PreparedRuntime> => ({ python: 'managed-python', source: dir }))
  const isPrepared = vi.fn(async () => true)
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ engines: [] }))))
  const manager = new ManagedRuntime(dir, { spawn }, prepare, isPrepared)
  managers.push(manager)
  return { dir, manager, spawn, prepare, isPrepared, children }
}

describe('managed service lifecycle', () => {
  it('does no preparation or spawn until first-use approval, then preserves safe commands and stop events', async () => {
    const f = await fixture(); f.isPrepared.mockResolvedValue(false)
    await f.manager.start(options)
    await f.manager.start({ ...options, port: 12345 })
    expect(f.manager.status().phase).toBe('needs-setup')
    expect(f.prepare).not.toHaveBeenCalled()
    expect(f.spawn).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    await f.manager.start(options, true)
    expect(f.manager.status().phase).toBe('ready')
    expect(f.prepare.mock.calls[0]?.[5]).toBe(true)
    expect(f.manager.status().activities?.some(event => event.kind === 'command' && event.detail.includes('serve.py'))).toBe(true)
    expect(JSON.stringify(f.manager.status().activities)).not.toContain(f.dir)
    await f.manager.stop()
    expect(f.manager.status().activities?.at(-1)?.kind).toBe('stop')
  })

  it('cleans generated files under ownership and retains unrelated settings and files', async () => {
    const f = await fixture(); await f.manager.start(options)
    await mkdir(join(f.dir, 'python')); await writeFile(join(f.dir, 'python', 'downloaded'), 'runtime')
    await writeFile(join(f.dir, 'cordis.patch.yml'), 'user preferences')
    await writeFile(join(f.dir, '.credentials.yaml'), 'synthetic credential')
    await f.manager.cleanup()
    expect(f.children[0]!.terminated).toBe(true)
    await expect(readFile(join(f.dir, 'python', 'downloaded'))).rejects.toThrow()
    expect(await readFile(join(f.dir, 'cordis.patch.yml'), 'utf8')).toBe('user preferences')
    expect(await readFile(join(f.dir, '.credentials.yaml'), 'utf8')).toBe('synthetic credential')
    expect(f.manager.status().phase).toBe('needs-setup')
    f.isPrepared.mockResolvedValue(false)
    await f.manager.start(options)
    expect(f.manager.status().phase).toBe('needs-setup')
    expect(f.children).toHaveLength(1)
  })

  it('refuses redirected cleanup roots and leaves another profile owner intact', async () => {
    const f = await fixture(); await f.manager.start(options)
    const duplicate = new ManagedRuntime(f.dir, { spawn: f.spawn }, f.prepare, f.isPrepared); managers.push(duplicate)
    await duplicate.cleanup()
    expect(duplicate.status().phase).toBe('failed')
    expect(f.manager.status().phase).toBe('ready')
    expect(f.children[0]!.terminated).toBe(false)
    const target = await mkdtemp(join(tmpdir(), 'searxng-clean-target-')); directories.push(target)
    await writeFile(join(target, 'secret'), 'retain')
    await symlink(target, join(f.dir, 'redirected'), process.platform === 'win32' ? 'junction' : 'dir')
    const redirected = new ManagedRuntime(join(f.dir, 'redirected'), { spawn: f.spawn }, f.prepare, f.isPrepared); managers.push(redirected)
    await redirected.cleanup()
    expect(redirected.status().phase).toBe('failed')
    expect(await readFile(join(target, 'secret'), 'utf8')).toBe('retain')
  })

  it('waits for readiness and stops only its owned handle, leaving the cache reusable', async () => {
    const f = await fixture()
    await f.manager.start(options)
    expect(f.manager.status()).toMatchObject({ phase: 'ready', endpoint: 'http://127.0.0.1:12345' })
    expect(f.spawn.mock.calls[0]![0].argv.at(-1)).toBe('0')
    await f.manager.stop()
    expect(f.children[0]!.terminated).toBe(true)
    expect(f.manager.status().phase).toBe('stopped')
    await f.manager.start({ ...options, port: 23456 })
    expect(f.spawn.mock.calls[1]![0].argv.at(-1)).toBe('23456')
  })

  it('rejects a second profile owner without spawning a duplicate service', async () => {
    const f = await fixture(); await f.manager.start(options)
    const duplicate = new ManagedRuntime(f.dir, { spawn: f.spawn }, f.prepare, f.isPrepared); managers.push(duplicate)
    await duplicate.start(options)
    expect(duplicate.status().phase).toBe('failed')
    expect(f.spawn).toHaveBeenCalledTimes(1)
    expect(f.manager.status().phase).toBe('ready')
  })

  it('bounds crash recovery and leaves a visible failure after repeated exits', async () => {
    const f = await fixture(); await f.manager.start(options)
    f.children[0]!.exit()
    await vi.waitFor(() => expect(f.children).toHaveLength(2))
    await vi.waitFor(() => expect(f.manager.status().phase).toBe('ready'))
    f.children[1]!.exit()
    await vi.waitFor(() => expect(f.manager.status().phase).toBe('failed'))
    expect(f.children).toHaveLength(2)
  })

  it('retains the unexpected exit and recovery reason after a successful restart', async () => {
    const f = await fixture(); await f.manager.start(options)
    const previous = f.manager.status().instanceId
    expect(previous).toMatch(/^[a-f0-9]{32}$/)
    f.children[0]!.exit({ exitCode: null, signal: 'SIGKILL' })
    await vi.waitFor(() => expect(f.children).toHaveLength(2))
    await vi.waitFor(() => expect(f.manager.status().phase).toBe('ready'))
    expect(f.manager.status().instanceId).not.toBe(previous)
    const activities = f.manager.status().activities!
    expect(activities.find(event => event.kind === 'error')?.detail).toContain('signal=SIGKILL')
    expect(activities.find(event => event.kind === 'error')?.detail).toContain('automaticRestart=true')
    expect(activities.find(event => event.kind === 'stop')?.detail).toBe('unexpected-exit-recovery')
  })

  it('distinguishes an operator stop from configuration changes without reporting a crash', async () => {
    const f = await fixture(); await f.manager.start(options)
    await f.manager.start(options, false, 'configuration-change')
    await f.manager.stop('operator-stop')
    expect(f.manager.status().activities?.filter(event => event.kind === 'stop').map(event => event.detail))
      .toEqual(['configuration-change', 'operator-stop'])
    expect(f.manager.status().activities?.filter(event => event.kind === 'error')).toEqual([])
  })

  it('cancels an in-progress installation and releases ownership', async () => {
    const f = await fixture()
    const waiting = new ManagedRuntime(f.dir, { spawn: f.spawn }, async (_dir, _command, signal) => {
      await new Promise<void>((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }))
      throw new Error('unreachable')
    }, f.isPrepared); managers.push(waiting)
    const start = waiting.start(options)
    await vi.waitFor(() => expect(waiting.status().phase).toBe('preparing'))
    await new Promise(r => setTimeout(r, 20))
    await waiting.stop(); await start
    expect(waiting.status().phase).toBe('stopped')
    await f.manager.start(options)
    expect(f.manager.status().phase).toBe('ready')
  })

  it('cleans up failed readiness and permits retry without an orphan process', async () => {
    const f = await fixture()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
    await f.manager.start({ ...options, startupTimeoutMs: 50 })
    expect(f.manager.status().phase).toBe('failed')
    expect(f.children[0]!.terminated).toBe(true)
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"engines":[]}')))
    await f.manager.start(options)
    expect(f.manager.status().phase).toBe('ready')
  })
})
