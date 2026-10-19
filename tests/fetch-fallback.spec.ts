import { WebError } from '@deepseek-ai/dsh-web'
import type { WebFetchProvider, WebFetchResult } from '@deepseek-ai/dsh-web'
import { expect, it, vi } from 'vitest'
import { HttpFallbackProvider, isVerificationPage } from '../src/fetch-fallback.ts'

const input = { url: 'https://page.example/article' }
const result = (statusCode = 200, content = 'Page'): WebFetchResult => ({ url: input.url, statusCode, body: { kind: 'text', content }, truncated: false })
function fixture(primary: () => Promise<WebFetchResult>, enabled = true) {
  const paid = vi.fn(async () => result(200, 'Official page'))
  const official = vi.fn(async (): Promise<WebFetchProvider> => ({ id: 'deepseek-fetch-api', available: () => true, fetch: paid }))
  const attempt = vi.fn()
  const state = { enabled }
  const provider = new HttpFallbackProvider(() => ({ id: 'http', available: () => true, fetch: vi.fn(primary) }), () => state.enabled, official, attempt)
  return { provider, paid, official, attempt, state }
}

it('keeps the default free and leaves successful local retrieval unchanged without resolving official credentials', async () => {
  const denied = result(403)
  const off = fixture(async () => denied, false)
  expect(await off.provider.fetch(input)).toBe(denied)
  expect(off.official).not.toHaveBeenCalled()
  const local = result()
  const on = fixture(async () => local)
  expect(await on.provider.fetch(input)).toBe(local)
  expect(on.official).not.toHaveBeenCalled()
})

it.each([403, 408, 429, 500, 503])('permits one disclosed official attempt after local HTTP %s', async status => {
  const f = fixture(async () => result(status))
  const served = await f.provider.fetch(input)
  expect(f.paid).toHaveBeenCalledTimes(1)
  expect(f.attempt).toHaveBeenCalledWith(`HTTP ${status}`)
  expect(served.body.content).toContain('可能产生费用')
  expect(served.body.content).toContain('Official page')
})

it('recognizes a bounded verification page and refuses to call it a successful official recovery', async () => {
  const challenge = '<html><title>Just a moment...</title></html>'
  expect(isVerificationPage(challenge)).toBe(true)
  expect(isVerificationPage('An article about checking your browser settings.')).toBe(false)
  const f = fixture(async () => result(200, challenge))
  f.paid.mockResolvedValueOnce(result(200, challenge))
  await expect(f.provider.fetch(input)).rejects.toThrow('also returned a verification page')
  expect(f.paid).toHaveBeenCalledTimes(1)
})

it.each(['WEB_ABORTED', 'WEB_INVALID_URL', 'WEB_BLOCKED_URL', 'WEB_REDIRECT_BLOCKED', 'WEB_FETCH_TOO_LARGE'])('never pays around local policy/cancellation code %s', async code => {
  const error = new WebError('Local refusal', code)
  const f = fixture(async () => { throw error })
  await expect(f.provider.fetch(input)).rejects.toBe(error)
  expect(f.official).not.toHaveBeenCalled()
})

it('checks cancellation and disabling again after asynchronous official credential resolution', async () => {
  for (const cancel of [true, false]) {
    const f = fixture(async () => result(403)), controller = new AbortController()
    let resolve!: (value: WebFetchProvider) => void, started!: () => void
    const waiting = new Promise<void>(done => { started = done })
    f.official.mockImplementationOnce(() => { started(); return new Promise(done => { resolve = done }) })
    const task = f.provider.fetch(input, controller.signal)
    await waiting
    if (cancel) controller.abort()
    else f.state.enabled = false
    resolve({ id: 'official', available: () => true, fetch: f.paid })
    await expect(task).rejects.toThrow('Local fetch returned HTTP 403')
    expect(f.paid).not.toHaveBeenCalled()
    expect(f.attempt).not.toHaveBeenCalled()
  }
})

it('reports the original failure and a bounded official failure without retrying again', async () => {
  const f = fixture(async () => { throw new WebError('Local transport failed', 'WEB_FETCH_TIMEOUT') })
  f.paid.mockRejectedValueOnce(new Error('synthetic credential detail'))
  await expect(f.provider.fetch(input)).rejects.toThrow('Local fetch failed (WEB_FETCH_TIMEOUT); official request failed; the official attempt may incur fetch fees')
  expect(f.paid).toHaveBeenCalledTimes(1)
})
