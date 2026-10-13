import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Context } from '@deepseek-ai/cordis'
import type { CredentialRecord } from '@deepseek-ai/dsh-credentials'
import WebRuntime from '@deepseek-ai/dsh-web'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as plugin from '../src/index.ts'
import { InstanceAuthStore } from '../src/instance-auth.ts'
import { SearxngSearchProvider } from '../src/provider.ts'

/** A public credential seam stand-in; no credential literal rides settings. */
export function memoryCredentials(ctx: Context) {
  const records = new Map<string, CredentialRecord>()
  const service = {
    describeRecord: vi.fn(async (key: string) => ({ configured: records.has(key), writable: true })),
    modifyRecord: vi.fn(async (key: string, mutate: (record: CredentialRecord | undefined) => Promise<CredentialRecord | undefined>) => {
      const next = await mutate(records.get(key)); if (next) records.set(key, next); return next
    }),
    readRecord: vi.fn(async (key: string) => records.get(key)),
    deleteRecord: vi.fn(async (key: string) => { records.delete(key) }),
  }
  ctx.provide('credentials', service as unknown as Context['credentials'])
  return service
}

afterEach(() => vi.unstubAllGlobals())

describe('endpoint-bound instance credentials', () => {
  it('stores values outside settings and describes only public facts', async () => {
    const ctx = new Context(); const credentials = memoryCredentials(ctx)
    const store = new InstanceAuthStore(ctx, () => '')
    const target = { baseURL: 'https://search.test/searxng/', headerName: 'X-Company-Key' }
    expect(await store.set(target, 'example-secret')).toEqual({ endpoint: 'https://search.test/searxng/', configured: true, writable: true })
    expect(JSON.stringify(await store.describe(target))).not.toContain('example-secret')
    expect(await store.resolve({ ...target, baseURL: 'https://search.test/searxng', headerName: 'x-company-key' }))
      .toEqual({ name: 'x-company-key', value: 'example-secret' })
    expect(credentials.modifyRecord).toHaveBeenCalledOnce()
    await expect(store.resolve({ ...target, baseURL: 'https://other.test/searxng' })).rejects.toThrow('No authentication value')
    await expect(store.resolve({ ...target, baseURL: 'https://search.test/other' })).rejects.toThrow('No authentication value')
    await expect(store.resolve({ ...target, baseURL: 'https://search.test/searxng//' })).rejects.toThrow('No authentication value')
    await expect(store.resolve({ ...target, headerName: 'Authorization' })).rejects.toThrow('No authentication value')
    await store.clear(target)
    await expect(store.resolve(target)).rejects.toThrow('No authentication value')
    await ctx.fiber.dispose()
  })

  it('uses an environment endpoint and the default header when fields are blank', async () => {
    const ctx = new Context(); memoryCredentials(ctx)
    const store = new InstanceAuthStore(ctx, () => 'https://env.test')
    await store.set({ baseURL: '', headerName: '' }, 'env-secret')
    expect(await store.resolve({ baseURL: 'https://env.test/', headerName: 'X-API-Key' })).toEqual({ name: 'X-API-Key', value: 'env-secret' })
    await ctx.fiber.dispose()
  })

  it.each(['Host', 'Accept', 'User-Agent', 'Connection', 'Proxy-Authorization', 'bad header', 'X-Key\r\nInjected'])('rejects unsafe header %s before storage', async headerName => {
    const ctx = new Context(); const credentials = memoryCredentials(ctx)
    const store = new InstanceAuthStore(ctx, () => '')
    await expect(store.set({ baseURL: 'https://search.test', headerName }, 'secret')).rejects.toThrow('Invalid authentication header name')
    expect(credentials.modifyRecord).not.toHaveBeenCalled()
    await ctx.fiber.dispose()
  })

  it.each(['bad\r\nvalue', 'bad\0value', '密钥', 'x'.repeat(8193)])('rejects invalid values without echoing them', async value => {
    const ctx = new Context(); memoryCredentials(ctx)
    const store = new InstanceAuthStore(ctx, () => '')
    const error = await store.set({ baseURL: 'https://search.test', headerName: 'X-Key' }, value).catch((error: unknown) => error)
    expect(String(error)).toContain('Invalid authentication header value')
    expect(String(error)).not.toContain(value)
    await ctx.fiber.dispose()
  })

  it('leaves ordinary use available when the credential service is absent', async () => {
    const ctx = new Context(); const store = new InstanceAuthStore(ctx, () => '')
    expect(await store.describe({ baseURL: 'https://search.test', headerName: '' })).toMatchObject({ configured: false, writable: false })
    await ctx.fiber.dispose()
  })
})

describe('authenticated search requests', () => {
  it('keeps defaults credential-free, authenticates search and card tests, and isolates changed targets', async () => {
    const seen: Array<{ path: string; key?: string }> = []
    const server = createServer((request, response) => {
      const key = request.headers['x-company-key'] as string | undefined
      seen.push({ path: request.url!, key })
      response.writeHead(key === 'example-secret' ? 200 : 401, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ results: [{ url: 'https://source.test/' }] }))
    })
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
    const baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    const ctx = new Context(); const credentials = memoryCredentials(ctx)
    try {
      await ctx.plugin(WebRuntime, { searchProvider: 'searxng' })
      const fiber = await ctx.plugin(plugin, { mode: 'external', baseURL, authHeaderName: 'X-Company-Key' })
      await expect(ctx.web.search({ query: 'default' })).rejects.toThrow('HTTP 401')
      expect(seen[0]?.key).toBeUndefined()
      await ctx.searxngRuntime.authSet({ baseURL, headerName: 'X-Company-Key' }, 'example-secret')
      expect(credentials.readRecord).not.toHaveBeenCalled()
      await fiber.dispose()
      const authenticated = await ctx.plugin(plugin, { mode: 'external', baseURL, authEnabled: true, authHeaderName: 'X-Company-Key' })
      await expect(ctx.web.search({ query: 'authenticated' })).resolves.toMatchObject({ sources: [{ url: 'https://source.test/' }] })
      await expect(ctx.searxngRuntime.test(new AbortController().signal)).resolves.toBe(1)
      expect(seen.slice(1).every(request => request.key === 'example-secret')).toBe(true)
      expect(seen[1]?.path).not.toContain('example-secret')
      await authenticated.dispose()
      await ctx.plugin(plugin, { mode: 'external', baseURL: `${baseURL}/other`, authEnabled: true, authHeaderName: 'X-Company-Key' })
      const count = seen.length
      await expect(ctx.web.search({ query: 'different target' })).rejects.toThrow('authentication is not ready')
      expect(seen).toHaveLength(count)
    } finally {
      await ctx.fiber.dispose(); server.closeAllConnections()
      await new Promise<void>(resolve => server.close(() => resolve()))
    }
  })

  it('supports Authorization with a complete Bearer value', async () => {
    const fetchMock = vi.fn<(url: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => new Response('{"results":[]}'))
    vi.stubGlobal('fetch', fetchMock)
    const provider = new SearxngSearchProvider(() => ({ baseURL: 'https://search.test', authEnabled: true }),
      async () => ({ name: 'Authorization', value: 'Bearer example-secret' }))
    await provider.search({ query: 'q' })
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ headers: { authorization: 'Bearer example-secret', accept: 'application/json' } })
  })

  it('does not resolve or send saved credentials when authentication is off', async () => {
    const resolve = vi.fn(async () => ({ name: 'X-Key', value: 'saved-secret' }))
    const fetchMock = vi.fn<(url: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => new Response('{"results":[]}'))
    vi.stubGlobal('fetch', fetchMock)
    await new SearxngSearchProvider(() => ({ baseURL: 'https://search.test' }), resolve).search({ query: 'q' })
    expect(resolve).not.toHaveBeenCalled()
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ headers: { accept: 'application/json' } })
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('saved-secret')
  })

  it.each(['network', 'body', 'abort-network', 'abort-body'])('removes credential-bearing %s exception details', async kind => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      if (kind === 'network') throw new Error('echo example-secret')
      if (kind === 'abort-network') throw new DOMException('echo example-secret', 'AbortError')
      return { ok: true, json: async () => {
        if (kind === 'abort-body') throw new DOMException('echo example-secret', 'AbortError')
        throw new Error('echo example-secret')
      } }
    }))
    const provider = new SearxngSearchProvider(() => ({ baseURL: 'https://search.test', authEnabled: true }),
      async () => ({ name: 'X-Key', value: 'example-secret' }))
    const error = await provider.search({ query: 'q' }).catch((error: unknown) => error)
    expect(error).toMatchObject({ code: kind.startsWith('abort') ? 'WEB_ABORTED' : 'WEB_PROVIDER_ERROR' })
    expect(String(error)).not.toContain('example-secret')
    expect((error as Error).cause).toBeUndefined()
  })
})
