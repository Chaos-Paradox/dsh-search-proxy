import { createServer } from 'node:http'
import { connect } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLaunchEnvironmentSnapshot } from '@deepseek-ai/dsh-launch-environment'
import { installProxyFromEnvironment, proxyRouteFor } from '@deepseek-ai/dsh-http-proxy'
import { ProcessProxy, proxyConfiguration } from '../src/process-proxy.ts'
import { PROXY_RISK_REVISION } from '../src/proxy-types.ts'
import type { ProxyPreferences, SavedProxy } from '../src/proxy-preferences.ts'

const environment = (values: Record<string, string> = {}) => createLaunchEnvironmentSnapshot([{ source: 'process', values }])
const instances: ProcessProxy[] = []
function manager(values: Record<string, string> = {}) { const proxy = new ProcessProxy(environment(values)); instances.push(proxy); return proxy }
async function approve(proxy: ProcessProxy) {
  const first = await proxy.begin()
  const second = await proxy.confirm(first.token, 'notice', PROXY_RISK_REVISION, false)
  return proxy.confirm(second.token, 'statement', PROXY_RISK_REVISION, true)
}
afterEach(async () => { vi.useRealTimers(); for (const proxy of instances.splice(0)) await proxy.dispose() })

describe('session proxy consent and ownership', () => {
  function rememberedProxy(initial?: SavedProxy) {
    let value = initial && structuredClone(initial)
    const preferences: ProxyPreferences = {
      available: () => true,
      read: vi.fn(async () => value && structuredClone(value)),
      write: vi.fn(async next => { value = structuredClone(next) }),
      forget: vi.fn(async () => { value = undefined }),
    }
    const create = () => { const proxy = new ProcessProxy(environment(), undefined, preferences); instances.push(proxy); return proxy }
    return { preferences, create, saved: () => value }
  }

  it('restores remembered enabled consent after unload and a new plugin instance without another approval', async () => {
    const store = rememberedProxy(), first = store.create()
    await first.restore()
    const grant = await approve(first)
    const configuration = { protocol: 'http' as const, host: 'localhost', port: 1, noProxy: '' }
    await first.apply(grant.token, configuration)
    expect(store.saved()).toEqual({ schema: 1, revision: PROXY_RISK_REVISION, enabled: true, configuration })
    await first.dispose()
    expect(proxyRouteFor(new URL('https://public-probe.invalid/')).proxied).toBe(false)
    const next = store.create()
    await next.restore()
    expect(await next.status()).toMatchObject({ state: 'active', remembered: true, restoreFailed: false })
    expect(JSON.stringify(await next.status())).not.toContain('localhost')
    const settings = await next.describe()
    expect(settings).toEqual({ state: 'active', remembered: true, restoreFailed: false, riskRevision: PROXY_RISK_REVISION, configuration })
    settings.configuration!.host = 'changed-by-client.example'
    expect((await next.describe()).configuration).toEqual(configuration)
    expect(store.preferences.write).toHaveBeenCalledTimes(1)
  })

  it('keeps an explicitly disabled proxy off after restart, resumes from memory and can forget it', async () => {
    const store = rememberedProxy(), first = store.create()
    await first.restore()
    const grant = await approve(first)
    await first.apply(grant.token, { protocol: 'http', host: 'localhost', port: 1, noProxy: '' })
    await first.remove()
    expect(store.saved()?.enabled).toBe(false)
    await first.dispose()
    const next = store.create()
    await next.restore()
    expect(await next.status()).toMatchObject({ state: 'off', remembered: true })
    expect((await next.describe()).configuration).toEqual(store.saved()?.configuration)
    await next.resume()
    expect((await next.status()).state).toBe('active')
    await next.forget()
    expect(store.saved()).toBeUndefined()
    expect(await next.status()).toMatchObject({ state: 'off', remembered: false })
    expect((await next.describe()).configuration).toBeUndefined()
    await expect(next.resume()).rejects.toThrow('risk statement')
  })

  it('does not reuse outdated consent or replace an existing host proxy on automatic restoration', async () => {
    const configuration = { protocol: 'http' as const, host: 'localhost', port: 1, noProxy: '' }
    const stale = rememberedProxy({ schema: 1, revision: 'old-risk-revision', enabled: true, configuration }).create()
    await stale.restore()
    expect(await stale.status()).toMatchObject({ state: 'off', remembered: false })
    expect((await stale.describe()).configuration).toEqual(configuration)
    await expect(stale.resume()).rejects.toThrow('risk statement')
    const store = rememberedProxy({ schema: 1, revision: PROXY_RISK_REVISION, enabled: true, configuration })
    const inherited = new ProcessProxy(environment({ HTTPS_PROXY: 'https://existing-proxy.example' }), undefined, store.preferences)
    instances.push(inherited)
    await inherited.restore()
    expect(await inherited.status()).toMatchObject({ state: 'inherited', remembered: true })
    expect((await inherited.describe()).configuration).toEqual(configuration)
    expect(proxyRouteFor(new URL('https://public-probe.invalid/')).proxied).toBe(false)
  })

  it('rolls back live routing when saving consent fails and reports failed restoration without deployment details', async () => {
    const store = rememberedProxy(), proxy = store.create()
    await proxy.restore()
    vi.mocked(store.preferences.write).mockRejectedValueOnce(new Error('private storage detail'))
    const grant = await approve(proxy)
    await expect(proxy.apply(grant.token, { protocol: 'http', host: 'localhost', port: 1, noProxy: '' })).rejects.toThrow('Could not remember')
    expect((await proxy.status()).state).toBe('off')
    expect(store.saved()).toBeUndefined()
    const bad = rememberedProxy()
    vi.mocked(bad.preferences.read).mockRejectedValueOnce(new Error('private endpoint'))
    const restoring = bad.create()
    await restoring.restore()
    expect(await restoring.status()).toMatchObject({ state: 'off', restoreFailed: true })
    expect(JSON.stringify(await restoring.status())).not.toContain('private endpoint')
  })

  it('does not activate without ordered statement reading and acknowledgement with rotating single-use grants', async () => {
    const proxy = manager(), port = 1
    expect((await proxy.status()).state).toBe('off')
    const first = await proxy.begin()
    await expect(proxy.confirm(first.token, 'statement', PROXY_RISK_REVISION, true)).rejects.toThrow('approval expired')
    await expect(proxy.apply(first.token, { protocol: 'http', host: 'localhost', port, noProxy: '' })).rejects.toThrow('approval expired')
    const approved = await approve(proxy)
    await expect(proxy.confirm(approved.token, 'notice', PROXY_RISK_REVISION, false)).rejects.toThrow('approval expired')
    expect(proxyRouteFor(new URL('https://public-probe.invalid/')).proxied).toBe(false)
  })

  it('expires and revokes consent on removal; never persists an endpoint', async () => {
    const proxy = manager(), approved = await approve(proxy)
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 300_001)
    await expect(proxy.apply(approved.token, { protocol: 'http', host: 'localhost', port: 1, noProxy: '' })).rejects.toThrow('approval expired')
    vi.restoreAllMocks()
    const fresh = await approve(proxy)
    await proxy.remove()
    await expect(proxy.apply(fresh.token, { protocol: 'http', host: 'localhost', port: 1, noProxy: '' })).rejects.toThrow('approval expired')
    expect(await proxy.status()).toEqual({ state: 'off', riskRevision: PROXY_RISK_REVISION })
  })

  it('requires an explicit acknowledgement after opening the statement, with no routing before apply', async () => {
    const proxy = manager()
    const notice = await proxy.begin()
    const statement = await proxy.confirm(notice.token, 'notice', PROXY_RISK_REVISION, false)
    await expect(proxy.confirm(statement.token, 'statement', PROXY_RISK_REVISION, false)).rejects.toThrow('acknowledgement required')
    expect((await proxy.status()).state).toBe('off')
    const approved = await proxy.confirm(statement.token, 'statement', PROXY_RISK_REVISION, true)
    expect(approved.step).toBe('approved')
    expect((await proxy.status()).state).toBe('off')
    await proxy.remove()
    await expect(proxy.apply(approved.token, { protocol: 'http', host: 'localhost', port: 1, noProxy: '' })).rejects.toThrow('approval expired')
  })

  it('respects startup proxies and reports a missing optional host API', async () => {
    const proxy = manager({ HTTPS_PROXY: 'http://proxy.example' })
    expect((await proxy.status()).state).toBe('inherited')
    await expect(proxy.begin()).rejects.toThrow('inherited')
    const unsupported = new ProcessProxy(environment(), async () => { throw new Error('missing module') })
    instances.push(unsupported)
    expect((await unsupported.status()).state).toBe('unavailable')
    await expect(unsupported.begin()).rejects.toThrow('unavailable')
  })

  it('rejects unsafe or incomplete endpoint input without echoing it', () => {
    const valid = { protocol: 'http' as const, host: 'localhost', port: 1, noProxy: 'internal.example,.corp.example' }
    for (const host of ['', 'user:password@proxy.example', 'proxy.example/path', 'http://proxy.example', 'proxy.example?secret', 'proxy.example\n']) {
      expect(() => proxyConfiguration({ ...valid, host })).toThrow(/^Invalid proxy configuration$/)
    }
    for (const port of [0, -1, 65536, 1.5, NaN]) expect(() => proxyConfiguration({ ...valid, port })).toThrow('Invalid proxy configuration')
    for (const noProxy of ['*', '10.0.0.0/8', 'https://example.com']) expect(() => proxyConfiguration({ ...valid, noProxy })).toThrow('Invalid proxy bypass')
    expect(proxyConfiguration({ ...valid, host: '[::1]' }).endpoint).toBe('http://[::1]:1')
  })

  it('routes real requests, cancels an active stream on removal and restores every environment value', async () => {
    const names = ['http_proxy', 'HTTP_PROXY', 'https_proxy', 'HTTPS_PROXY', 'no_proxy', 'NO_PROXY', 'all_proxy', 'ALL_PROXY']
    const original = Object.fromEntries(names.map(name => [name, process.env[name]]))
    const seen: string[] = []
    const server = createServer((req, res) => {
      seen.push(req.url ?? '')
      res.writeHead(200, { 'content-type': 'text/plain' })
      if (req.url?.includes('/stream')) res.write('open stream')
      else res.end('proxied')
    })
    const origin = createServer((req, res) => {
      seen.push(`http://public-probe.invalid${req.url}`)
      res.writeHead(200, { 'content-type': 'text/plain' })
      if (req.url === '/stream') res.write('open stream')
      else res.end('proxied')
    })
    await new Promise<void>((resolve, reject) => { origin.once('error', reject); origin.listen(0, '127.0.0.1', resolve) })
    const originAddress = origin.address()
    if (!originAddress || typeof originAddress === 'string') throw new Error('Missing fixture address')
    server.on('connect', (_req, socket, head) => {
      const target = connect(originAddress.port, '127.0.0.1', () => {
        socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        if (head.length) target.write(head)
        socket.pipe(target); target.pipe(socket)
      })
      socket.on('error', () => target.destroy()); target.on('error', () => socket.destroy())
      socket.on('close', () => target.destroy())
    })
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing fixture address')
    const proxy = manager({ NO_PROXY: 'preserved.example' })
    try {
      const approved = await approve(proxy)
      const input = { protocol: 'http' as const, host: '127.0.0.1', port: address.port, noProxy: 'extra.example' }
      expect((await proxy.apply(approved.token, input)).state).toBe('active')
      expect(await fetch('http://public-probe.invalid/', { signal: AbortSignal.timeout(2000) }).then(r => r.text())).toBe('proxied')
      expect(seen).toEqual(['http://public-probe.invalid/'])
      expect(proxyRouteFor(new URL('http://preserved.example/')).proxied).toBe(false)
      expect(proxyRouteFor(new URL('http://extra.example/')).proxied).toBe(false)
      expect(proxyRouteFor(new URL('http://127.0.0.1/')).proxied).toBe(false)
      const second = manager()
      expect((await second.status()).state).toBe('inherited')
      const stream = await fetch('http://public-probe.invalid/stream', { signal: AbortSignal.timeout(2000) })
      const body = stream.text().catch(() => 'cancelled')
      const removing = Date.now()
      await proxy.remove()
      expect(Date.now() - removing).toBeLessThan(1000)
      expect(await body).toBe('cancelled')
      expect(proxyRouteFor(new URL('http://public-probe.invalid/')).proxied).toBe(false)
      expect(Object.fromEntries(names.map(name => [name, process.env[name]]))).toEqual(original)
      await expect(proxy.apply(approved.token, input)).rejects.toThrow('approval expired')
    } finally {
      await proxy.dispose(); server.closeAllConnections(); origin.closeAllConnections()
      await Promise.all([new Promise<void>(resolve => server.close(() => resolve())), new Promise<void>(resolve => origin.close(() => resolve()))])
    }
  })

  it('does not remove a pre-existing host proxy on plugin disposal', async () => {
    const release = await installProxyFromEnvironment({ get: name => name === 'HTTPS_PROXY' ? { value: 'http://proxy.example' } : undefined }, () => {})
    const before = proxyRouteFor(new URL('https://public-probe.invalid/'))
    try {
      const proxy = manager()
      expect((await proxy.status()).state).toBe('inherited')
      await proxy.dispose()
      expect(proxyRouteFor(new URL('https://public-probe.invalid/'))).toEqual(before)
    } finally { await release() }
  })

  it('restores partially published environment after host installation failure and consumes the grant', async () => {
    const original = process.env.HTTP_PROXY
    const proxy = new ProcessProxy(environment(), async () => ({
      proxyRouteFor,
      installProxyFromEnvironment: async () => { process.env.HTTP_PROXY = 'partial-install'; throw new Error('private failure text') },
    }))
    instances.push(proxy)
    const grant = await approve(proxy)
    await expect(proxy.apply(grant.token, { protocol: 'http', host: 'localhost', port: 1, noProxy: '' })).rejects.toThrow(/^Could not activate the session proxy$/)
    expect(process.env.HTTP_PROXY).toBe(original)
    expect((await proxy.status()).state).toBe('off')
    await expect(proxy.apply(grant.token, { protocol: 'http', host: 'localhost', port: 1, noProxy: '' })).rejects.toThrow('approval expired')
  })

  it('cancels an installation racing plugin disposal and releases its resource exactly once', async () => {
    let start!: () => void, finish!: () => void
    const started = new Promise<void>(resolve => { start = resolve })
    const installation = new Promise<void>(resolve => { finish = resolve })
    const release = vi.fn(async () => {})
    const proxy = new ProcessProxy(environment(), async () => ({
      proxyRouteFor,
      installProxyFromEnvironment: async () => { start(); await installation; return release },
    }))
    instances.push(proxy)
    const grant = await approve(proxy)
    const applying = proxy.apply(grant.token, { protocol: 'http', host: 'localhost', port: 1, noProxy: '' })
    await started
    const disposing = proxy.dispose()
    finish()
    await expect(applying).rejects.toThrow('Could not activate')
    await disposing
    expect(release).toHaveBeenCalledTimes(1)
  })
})
