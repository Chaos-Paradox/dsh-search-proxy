/** Explicitly opted-in direct Search/Fetch calls; credentials are resolved per operation. */
import type { Context } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import { WebError } from '@deepseek-ai/dsh-web'
import type { WebFetchProvider, WebSearchProvider, WebSearchSource } from '@deepseek-ai/dsh-web'
import { validAuthHeaderValue } from './auth-types.ts'
import { hostConfiguration } from './host-configuration.ts'

const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1/tools'
const MAX_TEXT = 100_000
type OfficialApi = { search: WebSearchProvider; fetch: WebFetchProvider }
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

function aborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new WebError('Official request cancelled', 'WEB_ABORTED')
}

/** Uses the rc.2 API section when present; older hosts use the documented endpoint and shared key reference. */
export async function prepareOfficialApi(ctx: Context, operation: 'search' | 'fetch' = 'search'): Promise<OfficialApi> {
  const config = hostConfiguration(ctx, 'web-deepseek-api', false) ?? {}
  let base: URL
  try {
    base = new URL(typeof config.baseURL === 'string' ? config.baseURL : DEFAULT_BASE_URL)
    if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error()
  } catch { throw new WebError('Invalid official Search/Fetch API configuration', 'WEB_PROVIDER_ERROR') }
  const baseURL = base.href.replace(/\/+$/, '')
  const agents = ctx.get('agents') as { currentInitiator(): { session: { requestContext(): { provider?: string } | undefined } } | undefined } | undefined
  const account = ctx.get('deepseekAccount') as { resolveToken(endpoint: string): Promise<string | undefined> } | undefined
  let headers: Record<string, string>
  try {
    const token = agents?.currentInitiator()?.session.requestContext()?.provider === 'deepseek-account'
      ? await account?.resolveToken(`${baseURL}/${operation}`) : undefined
    if (token) {
      if (!validAuthHeaderValue(token)) throw new Error()
      headers = { 'x-dsh-auth-token': token }
    } else {
      const ref = credentialRef(typeof config.apiKeyEnv === 'string' ? config.apiKeyEnv : 'DEEPSEEK_API_KEY')
      const credentials = ctx.get('credentials')
      const key = typeof config.apiKey === 'string' && config.apiKey ? config.apiKey
        : credentials ? (await credentials.resolve(ref))?.value : launchEnvironmentOf(ctx).get(ref)?.value
      if (!key || !validAuthHeaderValue(key)) throw new Error()
      headers = { authorization: `Bearer ${key}` }
    }
  } catch { throw new WebError('Official Search/Fetch API credentials are unavailable; configure the DeepSeek API key or account', 'WEB_PROVIDER_CREDENTIAL_MISSING') }

  async function request(operation: 'search' | 'fetch', body: object, signal?: AbortSignal): Promise<unknown> {
    aborted(signal)
    const timeout = AbortSignal.timeout(20_000)
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
    let response: Response
    try {
      response = await fetch(`${baseURL}/${operation}`, { method: 'POST', redirect: 'error', signal: combined,
        headers: { ...headers, 'content-type': 'application/json', accept: 'application/json', 'user-agent': 'dsh-search-proxy' },
        body: JSON.stringify(body) })
      aborted(signal)
      if (!response.ok) {
        await response.body?.cancel()
        throw new WebError(`Official ${operation} API failed (HTTP ${response.status})`, 'WEB_PROVIDER_ERROR')
      }
      const reader = response.body?.getReader()
      if (!reader) throw new Error()
      const decoder = new TextDecoder(), chunks: string[] = []
      let bytes = 0
      try {
        while (true) {
          const chunk = await reader.read()
          if (chunk.done) break
          bytes += chunk.value.byteLength
          if (bytes > 6_000_000) { await reader.cancel(); throw new WebError('Official API response exceeds the size limit', 'WEB_PROVIDER_ERROR') }
          chunks.push(decoder.decode(chunk.value, { stream: true }))
        }
        chunks.push(decoder.decode())
      } finally { reader.releaseLock() }
      aborted(signal)
      return JSON.parse(chunks.join('')) as unknown
    } catch (error) {
      aborted(signal)
      if (error instanceof WebError) throw error
      throw new WebError(timeout.aborted ? 'Official API request timed out' : 'Official API request or response failed', 'WEB_PROVIDER_ERROR')
    }
  }

  return {
    search: {
      id: 'deepseek-search-api', available: () => true,
      async search(input, signal) {
        if (!input.query.trim() || [...input.query].length > 128) throw new WebError('Official Search API requires a query of 1–128 characters', 'WEB_PROVIDER_ERROR')
        if (input.maxResults !== undefined && (!Number.isInteger(input.maxResults) || input.maxResults < 0)) throw new WebError('Invalid official search result limit', 'WEB_PROVIDER_ERROR')
        if (input.maxResults === 0) return { sources: [], truncated: false }
        const configuredCount = Number.isInteger(config.count) ? Number(config.count) : 10
        const count = Math.min(50, Math.max(1, configuredCount), Math.max(1, input.maxResults ?? 50))
        const payload = await request('search', { query: input.query, count, need_content: false }, signal)
        if (!record(payload) || !Array.isArray(payload.results)) throw new WebError('Official Search API returned invalid results', 'WEB_PROVIDER_ERROR')
        const sources: WebSearchSource[] = []
        for (const result of payload.results) {
          if (!record(result) || typeof result.url !== 'string' || !URL.canParse(result.url)) continue
          const url = new URL(result.url)
          if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) continue
          sources.push({ url: result.url, ...typeof result.title === 'string' ? { title: result.title } : {},
            ...typeof result.snippet === 'string' ? { snippet: result.snippet } : {}, ...typeof result.date === 'string' ? { publishedAt: result.date } : {} })
        }
        const limit = Math.max(0, input.maxResults ?? count)
        return { sources: sources.slice(0, limit), truncated: sources.length > limit }
      },
    },
    fetch: {
      id: 'deepseek-fetch-api', available: () => true,
      async fetch(input, signal) {
        if (input.url.length > 8192 || !URL.canParse(input.url)) throw new WebError('Invalid URL for the official Fetch API', 'WEB_INVALID_URL')
        const url = new URL(input.url)
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new WebError('Invalid URL for the official Fetch API', 'WEB_INVALID_URL')
        const payload = await request('fetch', { url: input.url }, signal)
        if (!record(payload) || typeof payload.content !== 'string' || !payload.content.trim()) throw new WebError('Official Fetch API returned no readable content', 'WEB_PROVIDER_ERROR')
        return { url: input.url, statusCode: 200, body: { kind: 'text', content: payload.content.slice(0, MAX_TEXT) }, truncated: payload.content.length > MAX_TEXT }
      },
    },
  }
}
