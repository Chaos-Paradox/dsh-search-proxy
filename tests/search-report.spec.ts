import { afterEach, describe, expect, it, vi } from 'vitest'
import { SearxngSearchProvider } from '../src/provider.ts'
import { parseSearchTestReport } from '../src/runtime-types.ts'

afterEach(() => vi.unstubAllGlobals())
const options = { baseURL: 'http://localhost:8080/mount', engines: 'bing,yahoo', language: 'en' }

describe('operator search reports', () => {
  it('reports the actual single query, saved preferences, HTTP and sources without fallback', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ results: [{ url: 'https://example.com', title: 'Example' }] })))
    vi.stubGlobal('fetch', fetchMock)
    const report = await new SearxngSearchProvider(() => options).testReport()
    expect(parseSearchTestReport(report)).toMatchObject({ query: 'SearXNG', endpoint: 'http://localhost:8080/mount/search', engines: 'bing,yahoo', language: 'en', httpStatus: 200, responseFormat: 'json', outcome: 'success', sourceCount: 1, authUsed: false, officialFallbackUsed: false })
    expect(new URL(fetchMock.mock.calls[0]![0].toString()).searchParams.get('q')).toBe('SearXNG')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(report.elapsedMs).toBeGreaterThanOrEqual(0)
  })

  it('distinguishes empty results, an HTTP refusal and malformed JSON', async () => {
    const provider = new SearxngSearchProvider(() => options)
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"results":[]}')))
    expect(await provider.testReport()).toMatchObject({ outcome: 'empty', sourceCount: 0, httpStatus: 200, failureStage: null })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('unauthorized', { status: 401 })))
    expect(await provider.testReport()).toMatchObject({ outcome: 'failed', httpStatus: 401, failureStage: 'authentication' })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>not JSON</html>')))
    expect(await provider.testReport()).toMatchObject({ outcome: 'failed', httpStatus: 200, responseFormat: 'invalid', failureStage: 'response' })
  })

  it('shows a whitelisted refusal code rather than raw exception or credential text', async () => {
    const token = 'report-synthetic-secret'
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError(token, { cause: Object.assign(new Error(token), { code: 'ECONNREFUSED' }) }) }))
    const report = await new SearxngSearchProvider(() => options).testReport()
    expect(report).toMatchObject({ failureStage: 'connection', httpStatus: null, message: 'ECONNREFUSED' })
    expect(JSON.stringify(report)).not.toContain(token)
    const authenticated = await new SearxngSearchProvider(() => ({ ...options, authEnabled: true }), async () => ({ name: 'X-API-Key', value: token })).testReport()
    expect(authenticated).toMatchObject({ failureStage: 'connection', authUsed: true })
    expect(JSON.stringify(authenticated)).not.toContain(token)
  })

  it('redacts an echoed credential in result titles and URLs and excludes executable links', async () => {
    const token = 'report-synthetic-secret'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ results: [
      { url: 'https://example.com/?token=' + token, title: token }, { url: 'javascript:alert(1)' },
    ] }))))
    const report = await new SearxngSearchProvider(() => ({ ...options, authEnabled: true }), async () => ({ name: 'X-API-Key', value: token })).testReport()
    expect(JSON.stringify(report)).not.toContain(token)
    expect(report.sources).toHaveLength(1)
    expect(() => parseSearchTestReport({ ...report, sources: [{ url: 'javascript:alert(1)' }] })).toThrow()
  })

  it('distinguishes cancellation and missing credentials without sending a request', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock)
    const signal = AbortSignal.abort(new Error('synthetic reason'))
    expect(await new SearxngSearchProvider(() => options).testReport(signal)).toMatchObject({ outcome: 'failed', failureStage: 'cancelled' })
    expect(await new SearxngSearchProvider(() => ({ ...options, authEnabled: true })).testReport()).toMatchObject({ failureStage: 'authentication', authUsed: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
