/** Local public HTTP retrieval with an independently opted-in, single official retry. */
import type { Context } from '@deepseek-ai/cordis'
import { WebError } from '@deepseek-ai/dsh-web'
import type { WebFetchProvider, WebFetchRequest, WebFetchResult } from '@deepseek-ai/dsh-web'
import { hostConfiguration } from './host-configuration.ts'
import { prepareOfficialApi } from './official-api.ts'

export const SEARXNG_FETCH_PROVIDER_ID = 'searxng-http'

/** Bounded detection of common verification pages; ordinary article text is not scanned for keywords. */
export function isVerificationPage(content: string): boolean {
  const opening = content.slice(0, 8192)
  return /<title[^>]*>\s*(?:just a moment|attention required|checking your browser|verify (?:you are|you're) human)[^<]*<\/title>/i.test(opening)
    || /\bcf-chl-(?:widget|opt|bypass|managed|challenge)/i.test(opening)
    || /^\s*#{0,2}\s*(?:just a moment|checking your browser|verify (?:you are|you're) human)[.!…\s]*$/im.test(opening.slice(0, 500))
}

export function fetchFallbackNotice(reason: string): string {
  return `⚠️ Local fetch failed (${reason}); one official DeepSeek Fetch API retry was used; fees may apply.\n`
    + `⚠️ 本地抓取失败（${reason}），本次已通过 DeepSeek 官方 Fetch API 重试一次，可能产生费用。`
}

export class HttpFallbackProvider implements WebFetchProvider {
  readonly id = SEARXNG_FETCH_PROVIDER_ID
  constructor(private readonly primary: () => WebFetchProvider | undefined, private readonly enabled: () => boolean,
    private readonly official: () => Promise<WebFetchProvider>, private readonly onAttempt: (reason: string) => void) {}
  available(): boolean { try { return this.primary()?.available() === true } catch { return false } }

  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    const primary = this.primary()
    if (!primary) throw new WebError('The public host HTTP fetch provider is unavailable', 'WEB_PROVIDER_CONFIGURED_UNAVAILABLE')
    let reason: string, original: unknown
    try {
      const result = await primary.fetch(request, signal)
      const retryStatus = [403, 408, 429].includes(result.statusCode) || result.statusCode >= 500
      const verification = isVerificationPage(result.body.content)
      if (!this.enabled() || !retryStatus && !verification) return result
      reason = verification ? 'verification page' : `HTTP ${result.statusCode}`
      original = new WebError(`Local fetch returned ${reason}`, 'WEB_PROVIDER_ERROR')
    } catch (error) {
      const code = error && typeof error === 'object' ? Reflect.get(error, 'code') : undefined
      // Safety, URL, redirect and size refusals never become a paid way around local policy.
      if (signal?.aborted || !this.enabled() || !['WEB_PROVIDER_ERROR', 'WEB_FETCH_TIMEOUT'].includes(code)) throw error
      reason = code
      original = error
    }
    if (signal?.aborted || !this.enabled()) throw original
    let official: WebFetchProvider
    try { official = await this.official() }
    catch { throw new WebError(`Local fetch failed (${reason}); official Fetch API credentials or configuration are unavailable; no official request was made`, 'WEB_PROVIDER_ERROR', { cause: original }) }
    if (signal?.aborted || !this.enabled()) throw original
    this.onAttempt(reason)
    try {
      const result = await official.fetch(request, signal)
      if (isVerificationPage(result.body.content)) throw new WebError('Official Fetch API also returned a verification page', 'WEB_PROVIDER_ERROR')
      const content = `${fetchFallbackNotice(reason)}\n\n${result.body.content}`
      return { ...result, body: { kind: 'text', content: content.slice(0, 100_000) }, truncated: result.truncated || content.length > 100_000 }
    } catch (error) {
      if (signal?.aborted || error instanceof WebError && error.code === 'WEB_ABORTED') throw error
      const detail = error instanceof WebError ? error.message : 'official request failed'
      throw new WebError(`Local fetch failed (${reason}); ${detail}; the official attempt may incur fetch fees`, 'WEB_PROVIDER_ERROR', { cause: original })
    }
  }
}

/** Import the target host's public implementation so its DNS, proxy and redirect policy stays authoritative. */
export async function createHttpFallbackProvider(ctx: Context, enabled: () => boolean): Promise<HttpFallbackProvider> {
  let Http: typeof import('@deepseek-ai/dsh-web-fetch-http')['HttpFetchProvider'] | undefined
  try {
    const module = await import('@deepseek-ai/dsh-web-fetch-http')
    if (typeof module.HttpFetchProvider === 'function') Http = module.HttpFetchProvider
  } catch { /* Optional host capability: search still loads; fetch reports unavailable. */ }
  return new HttpFallbackProvider(() => {
    if (!Http) return undefined
    const config = hostConfiguration(ctx, 'web-fetch-http') ?? {}
    const positive = (key: string, fallback: number) => {
      const value = config[key] ?? fallback
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new WebError('Invalid host HTTP fetch limits', 'WEB_PROVIDER_CONFIGURED_UNAVAILABLE')
      return value
    }
    const maxRedirects = config.maxRedirects ?? 5
    if (!Number.isInteger(maxRedirects) || Number(maxRedirects) < 0) throw new WebError('Invalid host redirect limit', 'WEB_PROVIDER_CONFIGURED_UNAVAILABLE')
    return new Http({ maxResponseBytes: positive('maxResponseBytes', 5_000_000), maxBodyChars: positive('maxBodyChars', 100_000),
      timeoutMs: positive('timeoutMs', 30_000), maxRedirects: Number(maxRedirects),
      userAgent: typeof config.userAgent === 'string' ? config.userAgent : 'deepseek-harness/0.0.1 (+https://github.com/deepseek-ai)' })
  }, enabled, async () => (await prepareOfficialApi(ctx, 'fetch')).fetch,
  reason => ctx.logger.warn('web-search-searxng: local fetch failed (%s); trying one explicitly enabled DeepSeek Fetch API request; fetch fees may apply', reason))
}
