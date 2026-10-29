import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { SearxngSearchProvider } from '../src/provider.ts'
import { SearxngRuntimeService } from '../src/runtime-service.ts'
import type { ServiceOptions } from '../src/runtime-service.ts'
import WebRuntime from '@deepseek-ai/dsh-web'
import * as plugin from '../src/index.ts'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { SearchTestReport } from '../src/runtime-types.ts'

const managed = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), dispose: vi.fn() }))
vi.mock('../src/managed-runtime.ts', () => ({ ManagedRuntime: class {
  start = managed.start
  stop = managed.stop
  dispose = managed.dispose
  status() { return { phase: 'ready', endpoint: 'http://127.0.0.1:12345', message: '', logs: '' } }
} }))

const options: ServiceOptions = { mode: 'local', externalURL: '', port: 0, setupTimeoutMs: 3000, startupTimeoutMs: 1000, restartLimit: 2 }
const provider = () => new SearxngSearchProvider(() => ({ baseURL: '' }))

describe('runtime dependency ordering', () => {
  it('retains only test summaries across plugin instances and clears them without restarting a service', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'searxng-journal-service-'))
    const contexts: Context[] = []
    const create = async () => {
      const ctx = new Context(); contexts.push(ctx)
      ctx.provide('profileContext', { dir: directory } as Context['profileContext'])
      const search = provider()
      const report: SearchTestReport = { time: new Date().toISOString(), query: 'private test query', endpoint: 'https://private-endpoint.example/search',
        engines: '', language: '', authUsed: true, officialFallbackUsed: false, outcome: 'success', failureStage: null,
        httpStatus: 200, responseFormat: 'json', elapsedMs: 12, sourceCount: 1, sources: [{ url: 'https://private-source.example/' }], message: 'private diagnostic' }
      vi.spyOn(search, 'testReport').mockResolvedValue(report)
      await ctx.plugin(ctx => { new SearxngRuntimeService(ctx, () => ({ ...options, mode: 'external', externalURL: 'https://private-endpoint.example' }), search).sync() })
      return ctx
    }
    try {
      const first = await create()
      await first.searxngRuntime.testReport(new AbortController().signal)
      await first.fiber.dispose()
      const raw = await readFile(join(directory, 'searxng/logs/runtime.jsonl'), 'utf8')
      for (const privateValue of ['private test query', 'private-endpoint', 'private-source', 'private diagnostic']) expect(raw).not.toContain(privateValue)
      const next = await create()
      await vi.waitFor(() => expect(next.searxngRuntime.status().activities).toHaveLength(1))
      expect(next.searxngRuntime.status().activities?.[0]?.detail).toContain('sources=1')
      const before = managed.start.mock.calls.length
      expect((await next.searxngRuntime.clearLogs()).logStorage?.bytes).toBe(0)
      expect(next.searxngRuntime.status().activities).toEqual([])
      expect(managed.start).toHaveBeenCalledTimes(before)
    } finally {
      for (const ctx of contexts) await ctx.fiber.dispose()
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('automatically starts when the process service mounts after the plugin', async () => {
    vi.clearAllMocks()
    const ctx = new Context()
    ctx.provide('profileContext', { dir: '/tmp/test-profile' } as Context['profileContext'])
    await ctx.plugin(ctx => { const service = new SearxngRuntimeService(ctx, () => options, provider()); service.sync() })
    expect(ctx.searxngRuntime.status().phase).toBe('idle')
    expect(managed.start).not.toHaveBeenCalled()
    const processes = await ctx.plugin(ctx => { ctx.provide('subprocess', { spawn: vi.fn() } as unknown as Context['subprocess']) })
    await vi.waitFor(() => expect(managed.start).toHaveBeenCalledTimes(1))
    expect(ctx.searxngRuntime.endpoint()).toBe('http://127.0.0.1:12345')
    await processes.dispose()
    await vi.waitFor(() => expect(managed.dispose).toHaveBeenCalledTimes(1))
    expect(ctx.searxngRuntime.endpoint()).toBe('')
    await ctx.plugin(ctx => { ctx.provide('subprocess', { spawn: vi.fn() } as unknown as Context['subprocess']) })
    await vi.waitFor(() => expect(managed.start).toHaveBeenCalledTimes(2))
    await ctx.fiber.dispose()
  })

  it('uses an existing endpoint without waiting for a process service', async () => {
    vi.clearAllMocks()
    const ctx = new Context()
    await ctx.plugin(ctx => {
      const service = new SearxngRuntimeService(ctx, () => ({ ...options, mode: 'auto', externalURL: 'http://existing.test' }), provider())
      service.sync()
    })
    expect(ctx.searxngRuntime.status()).toMatchObject({ phase: 'external', endpoint: 'http://existing.test' })
    expect(managed.start).not.toHaveBeenCalled()
    await ctx.fiber.dispose()
  })

  it('probes the fixed download endpoints and counts only sub-500 HTTP answers as reachable', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async input => {
      const url = input.toString()
      if (url.includes('codeload')) return new Response('', { status: 200 })
      if (url.includes('files.pythonhosted')) return new Response('', { status: 403 })
      if (url.includes('pypi')) return new Response('', { status: 502 })
      throw new TypeError('fetch failed')
    })
    vi.stubGlobal('fetch', fetchMock)
    const ctx = new Context()
    try {
      await ctx.plugin(ctx => { new SearxngRuntimeService(ctx, () => ({ ...options, mode: 'external', externalURL: 'http://existing.test' }), provider()).sync() })
      const report = await ctx.searxngRuntime.precheck(new AbortController().signal)
      expect(report.targets).toHaveLength(4)
      const byUrl = Object.fromEntries(report.targets.map(target => [target.url, target]))
      expect(byUrl['https://codeload.github.com/']).toMatchObject({ ok: true, detail: 'HTTP 200' })
      expect(byUrl['https://files.pythonhosted.org/']).toMatchObject({ ok: true, detail: 'HTTP 403' })
      expect(byUrl['https://pypi.org/simple/']).toMatchObject({ ok: false, detail: 'HTTP 502' })
      expect(byUrl['https://github.com/']?.ok).toBe(false)
      expect(byUrl['https://github.com/']?.detail).toContain('fetch failed')
      for (const target of report.targets) expect(target.elapsedMs).toBeGreaterThanOrEqual(0)
      expect(fetchMock.mock.calls.every(call => (call[1]?.signal as AbortSignal | undefined)?.aborted === false)).toBe(true)
    } finally { await ctx.fiber.dispose(); vi.unstubAllGlobals() }
  })

  it('reports live public Web route overrides without editing them or exposing other settings', async () => {
    const ctx = new Context()
    let value: unknown = { searchProvider: 'searxng', fetchProvider: 'http', privateValue: 'hidden' }
    const describe = vi.fn(() => [{ ns: 'web', value }])
    ctx.provide('settings', { describe })
    try {
      await ctx.plugin(ctx => { new SearxngRuntimeService(ctx, () => ({ ...options, mode: 'external', externalURL: 'http://existing.test' }), provider()).sync() })
      expect(ctx.searxngRuntime.status().routing).toEqual({ searchProvider: 'searxng', fetchProvider: 'http', searchSource: 'configuration', fetchSource: 'configuration' })
      value = { searchProvider: 'deepseek-search-api', fetchProvider: 'deepseek-fetch-api', privateValue: 'hidden' }
      expect(ctx.searxngRuntime.status().routing).toEqual({ searchProvider: 'deepseek-search-api', fetchProvider: 'deepseek-fetch-api', searchSource: 'configuration', fetchSource: 'configuration' })
      expect(JSON.stringify(ctx.searxngRuntime.status())).not.toContain('hidden')
      expect(describe).toHaveBeenCalledWith({ redactSecrets: true })
    } finally { await ctx.fiber.dispose() }
  })

  it('keeps managed local requests credential-free even with saved external authentication settings', async () => {
    const fetchMock = vi.fn<(url: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => new Response('{"results":[]}'))
    vi.stubGlobal('fetch', fetchMock)
    const ctx = new Context()
    try {
      ctx.provide('profileContext', { dir: '/tmp/test-profile' } as Context['profileContext'])
      ctx.provide('subprocess', { spawn: vi.fn() } as unknown as Context['subprocess'])
      const readRecord = vi.fn()
      ctx.provide('credentials', { readRecord } as unknown as Context['credentials'])
      await ctx.plugin(WebRuntime, { searchProvider: 'searxng' })
      await ctx.plugin(plugin, { mode: 'local', baseURL: 'https://external.test', authEnabled: true, authHeaderName: 'Authorization' })
      await ctx.web.search({ query: 'local' })
      expect(readRecord).toHaveBeenCalledTimes(1)
      expect(readRecord.mock.calls[0]?.[0]).toMatch(/^web-search-searxng\/process-proxy-[a-f0-9]{64}$/)
      expect(fetchMock.mock.calls[0]?.[0].toString()).toContain('127.0.0.1:12345')
      expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty('authorization')
    } finally { await ctx.fiber.dispose(); vi.unstubAllGlobals() }
  })
})
