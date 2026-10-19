import { Context } from '@deepseek-ai/cordis'
import { afterEach, expect, it, vi } from 'vitest'
import { prepareOfficialApi } from '../src/official-api.ts'

afterEach(() => vi.unstubAllGlobals())
function context(config: Record<string, unknown> = {}) {
  const ctx = new Context()
  const resolve = vi.fn(async () => ({ value: 'synthetic-official-key', source: 'file' }))
  ctx.provide('credentials', { resolve } as unknown as Context['credentials'])
  ctx.provide('settings', { describe: () => [{ ns: 'web-deepseek-api', value: config }] })
  return { ctx, resolve }
}

it('resolves the current shared key for each operation and calls Search directly once with bounded results', async () => {
  const { ctx, resolve } = context({ count: 50 })
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ results: [
    { url: 'https://source.example/one', title: 'One', snippet: 'Excerpt', date: '2026-10-19' },
    { url: 'javascript:alert(1)' }, { url: 'https://source.example/two' },
  ] })))
  vi.stubGlobal('fetch', fetchMock)
  try {
    const result = await (await prepareOfficialApi(ctx)).search.search({ query: 'query', maxResults: 1 })
    expect(result).toEqual({ sources: [{ url: 'https://source.example/one', title: 'One', snippet: 'Excerpt', publishedAt: '2026-10-19' }], truncated: true })
    const [url, options] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.deepseek.com/v1/tools/search')
    expect(JSON.parse(String(options?.body))).toEqual({ query: 'query', count: 1, need_content: false })
    expect(options?.redirect).toBe('error')
    expect(options?.headers).toMatchObject({ authorization: 'Bearer synthetic-official-key' })
    await prepareOfficialApi(ctx)
    expect(resolve).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  } finally { await ctx.fiber.dispose() }
})

it('uses the configured API deployment and account token for the exact operation, without sending an API key', async () => {
  const { ctx, resolve } = context({ baseURL: 'https://gateway.example/prefix/v1/tools' })
  const token = vi.fn(async () => 'synthetic-account-token')
  ctx.provide('agents', { currentInitiator: () => ({ session: { requestContext: () => ({ provider: 'deepseek-account' }) } }) })
  ctx.provide('deepseekAccount', { resolveToken: token })
  const fetchMock = vi.fn<typeof fetch>(async () => new Response('{"content":"# Page"}'))
  vi.stubGlobal('fetch', fetchMock)
  try {
    const result = await (await prepareOfficialApi(ctx, 'fetch')).fetch.fetch({ url: 'https://page.example/article' })
    expect(result).toMatchObject({ statusCode: 200, url: 'https://page.example/article', body: { kind: 'text', content: '# Page' } })
    expect(token).toHaveBeenCalledWith('https://gateway.example/prefix/v1/tools/fetch')
    expect(resolve).not.toHaveBeenCalled()
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({ 'x-dsh-auth-token': 'synthetic-account-token' })
    expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty('authorization')
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://gateway.example/prefix/v1/tools/fetch')
  } finally { await ctx.fiber.dispose() }
})

it('does not dispatch when credentials, input or cancellation prevent an authorized request', async () => {
  const { ctx, resolve } = context()
  const fetchMock = vi.fn<typeof fetch>(); vi.stubGlobal('fetch', fetchMock)
  try {
    const api = await prepareOfficialApi(ctx)
    await expect(api.search.search({ query: 'x'.repeat(129) })).rejects.toThrow('1–128')
    await expect(api.fetch.fetch({ url: 'https://user:secret@page.example/' })).rejects.toThrow('Invalid URL')
    await expect(api.fetch.fetch({ url: 'https://page.example/' }, AbortSignal.abort())).rejects.toMatchObject({ code: 'WEB_ABORTED' })
    resolve.mockResolvedValueOnce(undefined as never)
    await expect(prepareOfficialApi(ctx)).rejects.toMatchObject({ code: 'WEB_PROVIDER_CREDENTIAL_MISSING' })
    expect(fetchMock).not.toHaveBeenCalled()
  } finally { await ctx.fiber.dispose() }
})

it('bounds API response errors and body size without echoing credential or upstream response text', async () => {
  const { ctx } = context()
  const fetchMock = vi.fn<typeof fetch>(async () => new Response('synthetic-official-key private failure', { status: 401 }))
  vi.stubGlobal('fetch', fetchMock)
  try {
    const api = await prepareOfficialApi(ctx)
    await expect(api.search.search({ query: 'query' })).rejects.toThrow(/^Official search API failed \(HTTP 401\)$/)
    fetchMock.mockResolvedValueOnce(new Response('{"results":{}}'))
    await expect(api.search.search({ query: 'query' })).rejects.toThrow('invalid results')
    fetchMock.mockResolvedValueOnce(new Response('x'.repeat(6_000_001)))
    await expect(api.fetch.fetch({ url: 'https://page.example/' })).rejects.toThrow('size limit')
  } finally { await ctx.fiber.dispose() }
})
