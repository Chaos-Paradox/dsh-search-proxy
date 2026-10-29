/** Built-artifact regression against an unpatched, built DSH checkout.
 * Run after build: DSH_SOURCE_ROOT=/path/to/deepseek-harness pnpm run test:host.
 * Uses real profile layers, Include, Loader, settings and bundle management;
 * only the official provider and SearXNG HTTP endpoint are deterministic probes.
 */
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const host = process.env.DSH_SOURCE_ROOT ?? resolve(root, '../deepseek-harness')
const runtime = process.env.DSH_RUNTIME_ROOT
const expectedVersion = process.env.DSH_EXPECTED_VERSION ?? '0.2.1-alpha.2'
const targets = { '0.2.1-alpha.2': { explicitSearch: false }, '0.2.1-rc.2': { explicitSearch: false } }
assert.ok(Object.hasOwn(targets, expectedVersion), 'Select an explicitly audited host target')
const anchor = runtime ? join(runtime, 'node_modules/@deepseek-ai/dsh/package.json') : join(host, 'apps/cli/package.json')
const requireHost = createRequire(runtime ? join(runtime, 'package.json') : join(host, 'packages/boot/app-boot/package.json'))
const hostModule = name => import(pathToFileURL(requireHost.resolve(name)).href)
const app = await hostModule('@deepseek-ai/dsh-app-boot')
const { default: Hmr } = runtime ? await hostModule('@deepseek-ai/dsh-hmr') : await import(pathToFileURL(join(host, 'packages/boot/hmr/lib/index.js')).href)
const { default: Timer } = await hostModule('@deepseek-ai/cordis-plugin-timer')
const { parse } = await import('yaml')
const { default: schema } = await hostModule('@deepseek-ai/schemastery')
assert.equal(app.getDshRuntimeVersion(), expectedVersion, 'Run against the exact unpatched DSH target')
assert.equal(app.evaluatePluginCompatibility(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))), undefined)

async function fixture(t, { user = [], home = [], overlays = [], selected = true, officialEndpoint } = {}) {
  const temporary = mkdtempSync(join(tmpdir(), 'searxng-host-'))
  let ctx
  const seen = []
  const seenHeaders = []
  let status = 200
  const server = createServer((req, res) => {
    seen.push(req.url)
    seenHeaders.push(req.headers)
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ results: [
      { url: 'https://source.test/one', title: 'One', content: 'SearXNG excerpt', publishedDate: '2026-10-10' },
      { url: 'https://source.test/two', title: 'Two' },
    ] }))
  })
  t.after(async () => {
    await ctx?.fiber.dispose()
    server.closeAllConnections()
    await new Promise((done, reject) => server.close(error => error ? reject(error) : done()))
    rmSync(temporary, { recursive: true, force: true })
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const endpoint = `http://127.0.0.1:${server.address().port}`
  const dir = join(temporary, 'profiles/test')
  const core = join(temporary, 'test-core')
  mkdirSync(core, { recursive: true })
  mkdirSync(join(dir, 'node_modules'), { recursive: true })
  symlinkSync(core, join(dir, 'node_modules/test-core'), 'dir')
  writeFileSync(join(core, 'package.json'), JSON.stringify({ name: 'test-core', dsh: { bundle: { patch: './cordis.patch.yml' } } }))
  const officialCalls = []
  const officialProbe = {
    inject: ['web'],
    apply(ctx) {
      for (const id of ['deepseek-official', 'previous-search']) ctx.web.registerSearchProvider({
        id, available: () => true,
        async search(request) { officialCalls.push({ id, request }); return { sources: [{ url: `https://${id}.test/` }], truncated: false } },
      })
      for (const id of ['http', 'previous-fetch']) ctx.web.registerFetchProvider({
        id, available: () => true, async fetch() { return { status: 200, content: id } },
      })
    },
  }
  writeFileSync(join(core, 'cordis.patch.yml'), JSON.stringify([{ insert: [
    { id: 'web', name: '@deepseek-ai/dsh-web', config: { searchProvider: 'previous-search', fetchProvider: 'previous-fetch' } },
    { id: 'official-probe', name: 'cordis:official-probe' },
    { id: 'config-editor', name: '@deepseek-ai/dsh-config-editor' },
    { id: 'settings', name: '@deepseek-ai/dsh-settings' },
    { id: 'credentials', name: '@deepseek-ai/dsh-credentials-local', config: { path: join(temporary, '.credentials.yaml'), watch: false } },
    { id: 'plugin-manager', name: '@deepseek-ai/dsh-plugin-manager' },
    ...officialEndpoint ? [{ id: 'web-deepseek-api', name: 'cordis:official-api-settings', config: { baseURL: officialEndpoint, apiKeyEnv: 'SEARXNG_FALLBACK_TEST_KEY' } }] : [],
  ] }]))
  symlinkSync(root, join(dir, 'node_modules/dsh-search-proxy'), 'dir')
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'test-profile', private: true,
    dsh: { profile: { bundles: ['test-core', ...selected ? ['dsh-search-proxy'] : []] } },
    dependencies: { 'test-core': `link:${core}`, 'dsh-search-proxy': `link:${root}` },
  }))
  writeFileSync(join(dir, 'cordis.yml'), '[]\n')
  const initialUser = JSON.stringify([{ id: 'web-search-searxng', config: { baseURL: endpoint } }, ...user]) + '\n'
  writeFileSync(join(dir, 'cordis.patch.yml'), initialUser)
  writeFileSync(join(temporary, 'cordis.patch.yml'), JSON.stringify(home))
  const loaded = app.loadProfileDirectory('test', dir, anchor)
  assert.deepEqual(loaded.skippedBundles, [])
  const profile = { name: 'test', dir, patchPath: join(dir, 'cordis.patch.yml'), installAnchor: anchor,
    cwd: temporary, home: temporary, overlays, startedBundles: loaded.layers.map(layer => layer.packageName), telemetryDisabledEnv: undefined }
  const resolution = await app.createRuntimeResolution({ profile: loaded, home: temporary, installAnchor: anchor })
  ctx = await app.boot('test', join(dir, 'cordis.yml'), app.readProfilePatches('test', profile), async ctx => {
    ctx.provide('profileContext', profile)
    ctx.provide('appReady', { onReady(listener) { listener(); return () => {} } })
    ctx.loader.builtins['official-probe'] = officialProbe
    ctx.loader.builtins['official-api-settings'] = { Config: schema.object({ baseURL: schema.string().volatile(), apiKeyEnv: schema.string().volatile() }), apply() {} }
    await ctx.plugin(app.PluginPackages, { resolution })
  })
  await ctx.plugin(Timer)
  await ctx.plugin(Hmr, { root: [], ignored: [], debounce: 0 })
  await ctx.hmr.runExclusive(async () => {})
  assert.equal(typeof ctx.web.searchWithProvider === 'function', targets[expectedVersion].explicitSearch, 'Public capabilities must match the audited host target')
  const reload = () => ctx.hmr.runExclusive(() => app.reconcileProfilePatches(ctx, app.readProfilePatches('test', profile), 'test'))
  return { ctx, dir, profile, endpoint, seen, seenHeaders, officialCalls, initialUser, reload,
    fail: () => { status = 503 },
    row: id => [...ctx.loader.entries()].find(entry => entry.options.id === id),
  }
}

test('bundle activation dispatches HTTP search and maps sources; settings save applies without remount', async t => {
  const f = await fixture(t)
  const fiber = f.row('web-search-searxng').fiber
  const result = await f.ctx.web.search({ query: 'test query', maxResults: 1 })
  assert.deepEqual(result, { sources: [{ url: 'https://source.test/one', title: 'One', snippet: 'SearXNG excerpt', publishedAt: '2026-10-10' }], truncated: true })
  assert.deepEqual(f.ctx.searxngRuntime.status().routing, { searchProvider: 'searxng', fetchProvider: 'searxng-http', searchSource: 'configuration', fetchSource: 'configuration', fallback: { searchApi: false, fetchApi: false, legacySearch: false } })
  assert.deepEqual(f.officialCalls, [])
  assert.equal(readFileSync(f.profile.patchPath, 'utf8'), f.initialUser)
  await f.ctx.settings.update('web-search-searxng', { engines: 'bing', language: 'zh-CN', allowOfficialFallback: false })
  assert.equal(f.row('web-search-searxng').fiber, fiber)
  await f.ctx.web.search({ query: 'saved' })
  assert.match(f.seen.at(-1), /engines=bing&language=zh-CN/)
  assert.equal(parse(readFileSync(f.profile.patchPath, 'utf8')).some(row => row.id === 'web'), false)
  await assert.rejects(f.ctx.web.fetch({ url: 'file:///not-a-web-resource' }), { code: 'WEB_INVALID_URL' })
})

test('operator report is reachable through the real shared API gateway after loading the built plugin', async t => {
  const f = await fixture(t)
  const connection = runtime ? await hostModule('@deepseek-ai/dsh-client-connection') : await import(pathToFileURL(join(host, 'packages/client/connection/lib/index.js')).href)
  const { default: Registry } = runtime ? await hostModule('@deepseek-ai/dsh-typert-registry') : await import(pathToFileURL(join(host, 'packages/typert/registry/lib/index.js')).href)
  const { default: Gateway } = runtime ? await hostModule('@deepseek-ai/dsh-api-gateway') : await import(pathToFileURL(join(host, 'packages/api/gateway/lib/index.js')).href)
  await f.ctx.plugin({ inject: connection.inject, apply: connection.apply })
  await f.ctx.plugin(Registry)
  if (runtime) await f.ctx.plugin((await hostModule('@deepseek-ai/dsh-api-remote-access')).default)
  await f.ctx.plugin(Gateway)
  const handler = f.ctx.connection.createSharedFetchHandler('/api')
  const method = 'searxngRuntime/testReport'
  const response = await handler.fetch(new Request(`http://localhost/api/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId: 'report-check', method, payload: { args: {} } }),
  }), runtime ? f.ctx.connection.browserPeer : undefined)
  assert.equal(response.status, 200, 'The report route must be claimed, not return HTTP 404')
  const envelope = await response.json()
  assert.equal(envelope.result.ok, true, JSON.stringify(envelope))
  assert.equal(envelope.result.value.httpStatus, 200)
  assert.equal(envelope.result.value.sourceCount, 2)
  const invoke = async (name, args = {}) => {
    const method = `searxngRuntime/${name}`
    const response = await handler.fetch(new Request(`http://localhost/api/${method}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'consent-check', method, payload: { args } }),
    }), runtime ? f.ctx.connection.browserPeer : undefined)
    assert.equal(response.status, 200)
    return (await response.json()).result
  }
  const notice = await invoke('proxyBegin')
  const settings = await invoke('proxyDescribe')
  assert.equal(settings.ok, true, 'Saved proxy settings must be reachable through the real operator RPC gateway')
  assert.equal(settings.value.configuration, undefined)
  assert.equal(notice.ok, true)
  const statement = await invoke('proxyConfirm', { token: notice.value.token, step: 'notice', revision: notice.value.riskRevision, accepted: false })
  assert.equal(statement.ok, true)
  const refused = await invoke('proxyConfirm', { token: statement.value.token, step: 'statement', revision: statement.value.riskRevision, accepted: false })
  assert.equal(refused.ok, false, 'An unchecked acknowledgement must not produce an activation grant')
  const grant = await invoke('proxyConfirm', { token: statement.value.token, step: 'statement', revision: statement.value.riskRevision, accepted: true })
  assert.equal(grant.ok, true)
  assert.equal(grant.value.step, 'approved')
  assert.equal((await invoke('proxyStatus')).value.state, 'off', 'Consent alone must not activate routing')
  const configuration = { protocol: 'http', host: '127.0.0.1', port: 1, noProxy: '.direct.example' }
  assert.equal((await invoke('proxyApply', { token: grant.value.token, configuration })).value.state, 'active')
  const saved = await invoke('proxyDescribe')
  assert.equal(saved.ok, true)
  assert.deepEqual(saved.value.configuration, configuration, 'The settings RPC must return all editable fields')
  assert.equal(saved.value.token, undefined)
  assert.equal((await invoke('proxyStatus')).value.configuration, undefined)
  await invoke('proxyRemove')
  const cleared = await invoke('clearLogs')
  assert.equal(cleared.ok, true, 'Log clearing must be available through the real operator gateway')
  assert.deepEqual(cleared.value.activities, [])
  assert.equal(cleared.value.logStorage.bytes, 0)
  await f.ctx.configEditor.edit(f.row('web'), raw => ({ ...raw, searchProvider: 'deepseek-official', fetchProvider: 'http' }))
  const beforeRestore = f.ctx.searxngRuntime.status()
  const restored = await invoke('restoreRoutes', { expectedRevision: beforeRestore.routeRestore.revision })
  assert.equal(restored.ok, true)
  assert.equal(restored.value.outcome, 'restored')
  assert.equal(restored.value.routing.searchProvider, 'searxng')
  assert.equal(restored.value.routing.fetchProvider, 'searxng-http')
})

test('explicit restoration uses the public editor, preserves saved paid permissions and routes real search back to SearXNG', async t => {
  const f = await fixture(t, { user: [{ id: 'web', config: { searchProvider: 'deepseek-official', fetchProvider: 'http' } }] })
  await f.ctx.settings.update('web-search-searxng', { allowOfficialApiFallback: true, allowOfficialFetchFallback: true })
  const preferences = parse(readFileSync(f.profile.patchPath, 'utf8')).filter(row => row.id !== 'web')
  const service = f.ctx.searxngRuntime
  const status = service.status()
  assert.equal(status.routeRestore.capability, 'available')
  assert.equal(service.status().routeRestore.revision, status.routeRestore.revision, 'Reading the page must not mutate routing')
  const result = await service.restoreRoutes(status.routeRestore.revision)
  assert.equal(result.outcome, 'restored')
  assert.deepEqual(result.routing.fallback, { searchApi: true, fetchApi: true, legacySearch: false })
  assert.deepEqual(parse(readFileSync(f.profile.patchPath, 'utf8')).filter(row => row.id !== 'web'), preferences)
  assert.equal(f.ctx.searxngRuntime.status().routing.searchProvider, 'searxng')
  assert.equal(f.ctx.searxngRuntime.status().routing.fetchProvider, 'searxng-http')
  await f.ctx.web.search({ query: 'restored actual dispatch' })
  assert.equal(f.seen.length, 1)
  assert.deepEqual(f.officialCalls, [])
})

for (const layer of ['home', 'overlays']) test(`${layer} route override refuses restoration before persistence`, async t => {
  const f = await fixture(t, { [layer]: [{ id: 'web', config: { searchProvider: 'deepseek-official', fetchProvider: 'http' } }] })
  const before = readFileSync(f.profile.patchPath, 'utf8')
  const service = f.ctx.searxngRuntime
  const result = await service.restoreRoutes(service.status().routeRestore.revision)
  assert.equal(result.outcome, 'blocked')
  assert.equal(readFileSync(f.profile.patchPath, 'utf8'), before)
  assert.equal(result.routing.searchProvider, 'deepseek-official')
  assert.equal(result.routing.fetchProvider, 'http')
})

test('route cost snapshot follows saved permissions and actual dispatch through API, mixed and Messages selections', async t => {
  const f = await fixture(t)
  const snapshot = () => f.ctx.searxngRuntime.status().routing
  await f.ctx.settings.update('web-search-searxng', { allowOfficialApiFallback: true, allowOfficialFetchFallback: true })
  assert.deepEqual(snapshot().fallback, { searchApi: true, fetchApi: true, legacySearch: false })
  await f.ctx.settings.update('web-search-searxng', { allowOfficialApiFallback: false, allowOfficialFetchFallback: false })
  const setRoutes = async (searchProvider, fetchProvider) => {
    if (runtime) await f.ctx.settings.update('web', { searchProvider, fetchProvider })
    else {
      const rows = parse(readFileSync(f.profile.patchPath, 'utf8')).filter(row => row.id !== 'web')
      rows.push({ id: 'web', config: { searchProvider, fetchProvider } })
      writeFileSync(f.profile.patchPath, JSON.stringify(rows))
      await f.reload()
    }
    assert.deepEqual(snapshot(), { searchProvider, fetchProvider, searchSource: 'configuration', fetchSource: 'configuration', fallback: { searchApi: false, fetchApi: false, legacySearch: false } })
  }
  await setRoutes('deepseek-search-api', 'deepseek-fetch-api')
  let searchCalls = 0, fetchCalls = 0
  f.ctx.web.registerSearchProvider({ id: 'deepseek-search-api', available: () => true, async search() { searchCalls++; return { sources: [], truncated: false } } })
  f.ctx.web.registerFetchProvider({ id: 'deepseek-fetch-api', available: () => true, async fetch() { fetchCalls++; return { url: 'https://source.test/', statusCode: 200, body: { kind: 'text', content: 'Fixture' }, truncated: false } } })
  await f.ctx.web.search({ query: 'probe of configured routing only' })
  await f.ctx.web.fetch({ url: 'https://source.test/' })
  assert.equal(searchCalls, 1, 'Direct host routes run independently of disabled plugin fallback permissions')
  assert.equal(fetchCalls, 1)
  assert.deepEqual(f.seen, [])
  await setRoutes('searxng', 'deepseek-fetch-api')
  await f.ctx.web.search({ query: 'mixed route' })
  assert.equal(f.seen.length, 1)
  await setRoutes('deepseek-official', 'http')
  await f.ctx.web.search({ query: 'built-in switch off' })
  assert.equal(f.seen.length, 1, 'Turning the API selection off does not restore SearXNG')
  assert.equal(f.officialCalls.at(-1).id, 'deepseek-official')
})

test('optional authentication uses real credential storage, applies live, and preserves the credential-free default', async t => {
  const f = await fixture(t)
  await f.ctx.web.search({ query: 'default' })
  assert.equal(f.seenHeaders.at(-1)['x-company-key'], undefined)
  const target = { baseURL: f.endpoint, headerName: 'X-Company-Key' }
  assert.equal((await f.ctx.searxngRuntime.authSet(target, 'host-auth-test-secret')).configured, true)
  const status = await f.ctx.searxngRuntime.authDescribe(target)
  assert.equal(JSON.stringify(status).includes('host-auth-test-secret'), false)
  await f.ctx.settings.update('web-search-searxng', { authEnabled: true, authHeaderName: 'X-Company-Key' })
  await f.ctx.web.search({ query: 'authenticated' })
  assert.equal(f.seenHeaders.at(-1)['x-company-key'], 'host-auth-test-secret')
  assert.equal(await f.ctx.searxngRuntime.test(new AbortController().signal), 2)
  const report = await f.ctx.searxngRuntime.testReport(new AbortController().signal)
  assert.equal(report.authUsed, true)
  assert.equal(report.httpStatus, 200)
  assert.equal(report.sourceCount, 2)
  assert.equal(report.officialFallbackUsed, false)
  assert.equal(JSON.stringify(report).includes('host-auth-test-secret'), false)
  assert.equal(JSON.stringify(f.ctx.searxngRuntime.status()).includes('host-auth-test-secret'), false)
  assert.equal(readFileSync(f.profile.patchPath, 'utf8').includes('host-auth-test-secret'), false)
  await f.ctx.settings.update('web-search-searxng', { baseURL: `${f.endpoint}/different` })
  const count = f.seen.length
  await assert.rejects(f.ctx.web.search({ query: 'changed target' }), /authentication is not ready/)
  assert.equal(f.seen.length, count)
  await f.ctx.settings.update('web-search-searxng', { baseURL: f.endpoint, authEnabled: false })
  await f.ctx.web.search({ query: 'disabled' })
  assert.equal(f.seenHeaders.at(-1)['x-company-key'], undefined)
  assert.equal((await f.ctx.searxngRuntime.authDescribe(target)).configured, true)
  await f.ctx.searxngRuntime.authClear(target)
  assert.equal((await f.ctx.searxngRuntime.authDescribe(target)).configured, false)
})

test('default failures and opt-in on an unsupported host make no paid request; cancellation never degrades', async t => {
  const f = await fixture(t)
  f.fail()
  const report = await f.ctx.searxngRuntime.testReport(new AbortController().signal)
  assert.equal(report.failureStage, 'http')
  assert.equal(report.httpStatus, 503)
  await assert.rejects(f.ctx.web.search({ query: 'fails' }), /SearXNG.*503/)
  await f.ctx.settings.update('web-search-searxng', { allowOfficialFallback: true })
  await assert.rejects(f.ctx.web.search({ query: 'unsupported' }), /SearXNG.*503.*fallback unavailable.*searchWithProvider.*no official request/s)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(f.ctx.web.search({ query: 'cancelled' }, controller.signal), { code: 'WEB_ABORTED' })
  assert.deepEqual(f.officialCalls, [])
})

test('new paid switches are independent, preserve the default and retry once through shared credentials and direct APIs', async t => {
  const calls = []
  const official = createServer(async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    calls.push({ url: req.url, headers: req.headers, body: JSON.parse(Buffer.concat(chunks).toString()) })
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(req.url.endsWith('/search') ? { results: [{ url: 'https://official.test/source', title: 'Official' }] } : { content: '# Official fetched content' }))
  })
  official.listen(0, '127.0.0.1')
  await once(official, 'listening')
  t.after(async () => { official.closeAllConnections(); await new Promise(done => official.close(done)) })
  const f = await fixture(t, { officialEndpoint: `http://127.0.0.1:${official.address().port}/v1/tools` })
  const { credentialRef } = runtime ? await hostModule('@deepseek-ai/dsh-credentials') : await import(pathToFileURL(join(host, 'packages/credentials/credentials/lib/index.js')).href)
  await f.ctx.credentials.set(credentialRef('SEARXNG_FALLBACK_TEST_KEY'), 'shared-fixture-key')
  f.fail()
  await assert.rejects(f.ctx.web.search({ query: 'free default' }), /503/)
  await f.ctx.settings.update('web-search-searxng', { allowOfficialFallback: true })
  await assert.rejects(f.ctx.web.search({ query: 'legacy consent' }), /searchWithProvider/)
  assert.equal(calls.length, 0, 'Legacy consent must not start new direct API billing')
  await f.ctx.settings.update('web-search-searxng', { allowOfficialApiFallback: true })
  const searched = await f.ctx.web.search({ query: 'paid retry', maxResults: 1 })
  assert.equal(searched.sources.length, 1)
  assert.match(searched.content, /可能产生额外费用/)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, '/v1/tools/search')
  assert.equal(calls[0].headers.authorization, 'Bearer shared-fixture-key')
  assert.equal(calls[0].headers['x-company-key'], undefined)
  assert.equal(readFileSync(f.profile.patchPath, 'utf8').includes('shared-fixture-key'), false)

  const sockets = new Set()
  const proxy = createServer((_req, res) => { res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }); res.end('denied') })
  proxy.on('connect', (_req, socket) => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket)); socket.on('error', () => {})
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
    socket.once('data', () => socket.end('HTTP/1.1 403 Forbidden\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: 6\r\nConnection: close\r\n\r\ndenied'))
  })
  proxy.listen(0, '127.0.0.1'); await once(proxy, 'listening')
  t.after(async () => { for (const socket of sockets) socket.destroy(); proxy.closeAllConnections(); await new Promise(done => proxy.close(done)) })
  const notice = await f.ctx.searxngRuntime.proxyBegin()
  const statement = await f.ctx.searxngRuntime.proxyConfirm(notice.token, 'notice', notice.riskRevision, false)
  const grant = await f.ctx.searxngRuntime.proxyConfirm(statement.token, 'statement', statement.riskRevision, true)
  await f.ctx.searxngRuntime.proxyApply(grant.token, { protocol: 'http', host: '127.0.0.1', port: proxy.address().port, noProxy: '' })
  const target = { url: 'http://public-probe.invalid/page' }
  const refused = await f.ctx.web.fetch(target)
  assert.equal(refused.statusCode, 403)
  assert.equal(calls.length, 1, 'Search permission must not authorize paid fetch')
  await f.ctx.settings.update('web-search-searxng', { allowOfficialFetchFallback: true })
  const fetched = await f.ctx.web.fetch(target)
  assert.equal(fetched.statusCode, 200)
  assert.match(fetched.body.content, /可能产生费用/)
  assert.match(fetched.body.content, /Official fetched content/)
  assert.equal(calls.length, 2)
  assert.equal(calls[1].url, '/v1/tools/fetch')
  assert.deepEqual(calls[1].body, target)
  await assert.rejects(f.ctx.web.fetch({ url: 'file:///blocked' }), { code: 'WEB_INVALID_URL' })
  assert.equal(calls.length, 2, 'A URL policy refusal must not start another paid attempt')
  await f.ctx.searxngRuntime.proxyForget()
})

test('bundle enable/disable restores arbitrary earlier routes, retains settings, and removal exposes the baseline', async t => {
  const f = await fixture(t, { selected: false })
  assert.match((await f.ctx.web.search({ query: 'before' })).sources[0].url, /previous-search/)
  assert.equal((await f.ctx.pluginManager.setBundleEnabled('dsh-search-proxy', true)).application, 'applied')
  assert.match((await f.ctx.web.search({ query: 'enabled' })).sources[0].url, /source.test/)
  await f.ctx.settings.update('web-search-searxng', { language: 'en' })
  const saved = readFileSync(f.profile.patchPath, 'utf8')
  assert.equal((await f.ctx.pluginManager.setBundleEnabled('dsh-search-proxy', false)).application, 'applied')
  assert.match((await f.ctx.web.search({ query: 'disabled' })).sources[0].url, /previous-search/)
  assert.equal((await f.ctx.web.fetch({ url: 'https://fetch.test' })).content, 'previous-fetch')
  assert.equal(readFileSync(f.profile.patchPath, 'utf8'), saved)
  assert.equal((await f.ctx.pluginManager.setBundleEnabled('dsh-search-proxy', true)).application, 'applied')
  await f.ctx.web.search({ query: 're-enabled' })
  assert.match(f.seen.at(-1), /language=en/)
  const removed = await f.ctx.pluginManager.removeBundle('dsh-search-proxy')
  assert.equal(removed.application, 'applied', JSON.stringify(removed))
  assert.equal(removed.packageResult.exitCode, 0)
  assert.equal(JSON.parse(readFileSync(join(f.dir, 'package.json'), 'utf8')).dependencies['dsh-search-proxy'], undefined)
  assert.match((await f.ctx.web.search({ query: 'removed' })).sources[0].url, /previous-search/)
  assert.equal(readFileSync(f.profile.patchPath, 'utf8'), saved)
})

test('bounded runtime summaries survive a real bundle reload and can be cleared without changing search', async t => {
  const f = await fixture(t)
  await f.ctx.web.search({ query: 'private-user-query-do-not-log' })
  await f.ctx.searxngRuntime.testReport(new AbortController().signal)
  await f.ctx.pluginManager.setBundleEnabled('dsh-search-proxy', false)
  const file = join(f.dir, 'searxng/logs/runtime.jsonl')
  const saved = readFileSync(file, 'utf8')
  assert.ok(Buffer.byteLength(saved) <= 128 * 1024)
  assert.ok(!saved.includes('private-user-query-do-not-log'))
  assert.ok(!saved.includes(f.endpoint), 'Search endpoints must not be persisted in test summaries')
  await f.ctx.pluginManager.setBundleEnabled('dsh-search-proxy', true)
  for (let attempt = 0; attempt < 50 && !f.ctx.searxngRuntime.status().activities.some(event => event.kind === 'test'); attempt++) {
    await new Promise(done => setTimeout(done, 10))
  }
  assert.ok(f.ctx.searxngRuntime.status().activities.some(event => event.subject === 'SearXNG test'))
  assert.equal(f.ctx.searxngRuntime.status().logStorage.maxBytes, 256 * 1024)
  const cleared = await f.ctx.searxngRuntime.clearLogs()
  assert.deepEqual(cleared.activities, [])
  assert.equal(cleared.logStorage.bytes, 0)
  assert.match((await f.ctx.web.search({ query: 'after-clearing' })).sources[0].url, /source.test/)
})

test('unavailable log storage keeps search and in-memory diagnostics usable', async t => {
  const f = await fixture(t)
  mkdirSync(join(f.dir, 'searxng'), { recursive: true })
  writeFileSync(join(f.dir, 'searxng/logs'), 'fixture blocking journal storage')
  const report = await f.ctx.searxngRuntime.testReport(new AbortController().signal)
  assert.equal(report.sourceCount, 2)
  for (let attempt = 0; attempt < 50 && !f.ctx.searxngRuntime.status().logStorage.failed; attempt++) {
    await new Promise(done => setTimeout(done, 10))
  }
  assert.equal(f.ctx.searxngRuntime.status().logStorage.failed, true)
  assert.ok(f.ctx.searxngRuntime.status().activities.some(event => event.kind === 'test'))
  assert.match((await f.ctx.web.search({ query: 'logging-failure' })).sources[0].url, /source.test/)
})

for (const layer of ['user', 'home', 'overlays']) test(`${layer} route override wins and the provider still activates`, async t => {
  const f = await fixture(t, { [layer]: [{ id: 'web', config: { searchProvider: 'previous-search', fetchProvider: 'previous-fetch' } }] })
  assert.ok(f.row('web-search-searxng').fiber)
  assert.match((await f.ctx.web.search({ query: 'override' })).sources[0].url, /previous-search/)
  assert.deepEqual(f.seen, [])
  assert.deepEqual(f.ctx.searxngRuntime.status().routing, { searchProvider: 'previous-search', fetchProvider: 'previous-fetch', searchSource: 'configuration', fetchSource: 'configuration', fallback: { searchApi: false, fetchApi: false, legacySearch: false } })
})

test('disabling only the provider row fails visibly and never auto-selects official search', async t => {
  const f = await fixture(t)
  const plugin = (await f.ctx.pluginManager.listPlugins()).find(row => row.patchId === 'web-search-searxng')
  assert.equal((await f.ctx.pluginManager.setPluginEnabled(plugin.entryId, false)).application, 'applied')
  await assert.rejects(f.ctx.web.search({ query: 'row disabled' }), { code: 'WEB_PROVIDER_CONFIGURED_MISSING' })
  assert.deepEqual(f.officialCalls, [])
})

test('remembered proxy restores on bundle enable, stays off after an explicit off, and releases policy on uninstall', async t => {
  const f = await fixture(t)
  const proxyApi = await import(pathToFileURL(createRequire(anchor).resolve('@deepseek-ai/dsh-http-proxy')).href)
  const probe = new URL('https://public-probe.invalid/')
  const originalRoute = proxyApi.proxyRouteFor(probe)
  const names = ['http_proxy', 'HTTP_PROXY', 'https_proxy', 'HTTPS_PROXY', 'no_proxy', 'NO_PROXY']
  const originalEnv = Object.fromEntries(names.map(name => [name, process.env[name]]))
  const connections = []
  const proxy = createServer((_req, res) => { res.writeHead(502); res.end() })
  proxy.on('connect', (req, socket) => { connections.push(req.url); socket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n') })
  proxy.listen(0, '127.0.0.1')
  await once(proxy, 'listening')
  t.after(async () => { proxy.closeAllConnections(); await new Promise(done => proxy.close(done)) })
  const input = { protocol: 'http', host: '127.0.0.1', port: proxy.address().port, noProxy: '' }
  async function activate() {
    const service = f.ctx.searxngRuntime
    assert.equal((await service.proxyStatus()).state, 'off')
    const risk = await service.proxyBegin()
    const scope = await service.proxyConfirm(risk.token, 'notice', risk.riskRevision, false)
    const grant = await service.proxyConfirm(scope.token, 'statement', scope.riskRevision, true)
    assert.equal((await service.proxyApply(grant.token, input)).state, 'active')
    assert.equal(proxyApi.proxyRouteFor(probe).proxied, true, 'Plugin and real host must share the public proxy API instance')
    await assert.rejects(fetch(probe, { signal: AbortSignal.timeout(2000) }))
    assert.ok(connections.length)
    assert.equal(readFileSync(f.profile.patchPath, 'utf8'), f.initialUser)
  }
  await activate()
  await f.ctx.pluginManager.setBundleEnabled('dsh-search-proxy', false)
  assert.deepEqual(proxyApi.proxyRouteFor(probe), originalRoute)
  assert.deepEqual(Object.fromEntries(names.map(name => [name, process.env[name]])), originalEnv)
  await f.ctx.pluginManager.setBundleEnabled('dsh-search-proxy', true)
  assert.equal((await f.ctx.searxngRuntime.proxyStatus()).state, 'active', 'Re-enabling must restore saved configuration without another approval')
  assert.equal((await f.ctx.searxngRuntime.proxyStatus()).remembered, true)
  assert.deepEqual((await f.ctx.searxngRuntime.proxyDescribe()).configuration, input, 'Remembered settings must refill after bundle reload')
  assert.equal((await f.ctx.searxngRuntime.proxyStatus()).configuration, undefined, 'Ordinary status must still omit deployment details')
  assert.equal(readFileSync(f.profile.patchPath, 'utf8'), f.initialUser)
  await f.ctx.searxngRuntime.proxyRemove()
  await f.ctx.pluginManager.setBundleEnabled('dsh-search-proxy', false)
  await f.ctx.pluginManager.setBundleEnabled('dsh-search-proxy', true)
  assert.equal((await f.ctx.searxngRuntime.proxyStatus()).state, 'off', 'An explicit off preference must survive reload')
  assert.deepEqual((await f.ctx.searxngRuntime.proxyDescribe()).configuration, input, 'Turning off must retain editable defaults')
  const risk = await f.ctx.searxngRuntime.proxyBegin()
  const statement = await f.ctx.searxngRuntime.proxyConfirm(risk.token, 'notice', risk.riskRevision, false)
  const grant = await f.ctx.searxngRuntime.proxyConfirm(statement.token, 'statement', statement.riskRevision, true)
  const updated = { ...input, noProxy: 'direct.example' }
  await f.ctx.searxngRuntime.proxyApply(grant.token, updated)
  await f.ctx.pluginManager.setBundleEnabled('dsh-search-proxy', false)
  await f.ctx.pluginManager.setBundleEnabled('dsh-search-proxy', true)
  assert.deepEqual((await f.ctx.searxngRuntime.proxyDescribe()).configuration, updated, 'Updated defaults must survive real credential storage and reload')
  await f.ctx.searxngRuntime.proxyRemove()
  await f.ctx.searxngRuntime.proxyResume()
  assert.equal((await f.ctx.searxngRuntime.proxyStatus()).state, 'active')
  assert.equal((await f.ctx.pluginManager.removeBundle('dsh-search-proxy')).application, 'applied')
  assert.deepEqual(proxyApi.proxyRouteFor(probe), originalRoute)
  assert.deepEqual(Object.fromEntries(names.map(name => [name, process.env[name]])), originalEnv)
})

for (const layer of ['home', 'overlays']) test(`${layer} settings override rejects a card write without altering the profile`, async t => {
  const f = await fixture(t, { [layer]: [{ id: 'web-search-searxng', config: { language: 'ja', allowOfficialFallback: false } }] })
  await assert.rejects(f.ctx.settings.update('web-search-searxng', { language: 'en' }), /overridden by a home patch or command-line overlay/)
  assert.equal(readFileSync(f.profile.patchPath, 'utf8'), f.initialUser)
})
