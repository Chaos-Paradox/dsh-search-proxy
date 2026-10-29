// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ServicePanel } from '../src/client/ServicePanel.tsx'
import { en } from '../src/client/locales.ts'
import type { SearchTestReport, ServiceResponse, ServiceStatus } from '../src/runtime-types.ts'
afterEach(cleanup)
const t = (key: keyof typeof en) => en[key]
const ready: ServiceStatus = { phase: 'ready', endpoint: 'http://127.0.0.1:43210', message: '', logs: 'local log' }
const report: SearchTestReport = { time: new Date().toISOString(), query: 'SearXNG', endpoint: ready.endpoint + '/search', engines: 'bing', language: 'en', authUsed: false, officialFallbackUsed: false, outcome: 'success', failureStage: null, httpStatus: 200, responseFormat: 'json', elapsedMs: 12, sourceCount: 3, sources: [], message: '' }

const fallbackOff = { searchApi: false, fetchApi: false, legacySearch: false }
const routing = (searchProvider = 'searxng', fetchProvider = 'searxng-http'): ServiceStatus['routing'] => ({ searchProvider, fetchProvider, searchSource: 'configuration', fetchSource: 'configuration', fallback: fallbackOff })

it('shows retention limits and clears saved records through an operator action', async () => {
  const saved: ServiceStatus = { ...ready, logStorage: { bytes: 2048, maxBytes: 256 * 1024, failed: false },
    activities: [{ time: '2026-10-28T10:00:00Z', kind: 'error', subject: 'SearXNG', detail: 'previous-run-error' }] }
  const call = vi.fn(async (method: string): Promise<ServiceResponse> => method === 'clearLogs'
    ? { ...saved, activities: [], logStorage: { ...saved.logStorage!, bytes: 0 } } : saved)
  render(<ServicePanel call={call} t={t} writable />)
  await screen.findByText(en.activityRetention)
  expect(screen.getByText(`${en.logStorageUsage}: 2 / 256 KiB`)).toBeTruthy()
  expect(screen.getByText('previous-run-error')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: en.clearSavedLogs }))
  await screen.findByText(`${en.logStorageUsage}: 0 / 256 KiB`)
  expect(screen.queryByText('previous-run-error')).toBeNull()
  expect(call.mock.calls.some(([method]) => method === 'clearLogs')).toBe(true)
})

it('keeps retained records viewable on a read-only page and explains a storage failure', async () => {
  render(<ServicePanel call={async () => ({ ...ready, logStorage: { bytes: 0, maxBytes: 256 * 1024, failed: true } })} t={t} writable={false} />)
  await screen.findByText(en.logStorageFailed)
  expect(screen.getByRole('button', { name: en.clearSavedLogs })).toHaveProperty('disabled', true)
})

it('warns about direct paid routes independently of plugin permissions or local readiness', async () => {
  const view = render(<ServicePanel call={async () => ({ ...ready, routing: routing('deepseek-search-api', 'deepseek-fetch-api') })} t={t} writable />)
  await screen.findByText(en.routingPaid)
  expect(screen.getByText('deepseek-search-api')).toBeTruthy()
  expect(screen.getByText('deepseek-fetch-api')).toBeTruthy()
  expect(screen.getAllByText(en.routingDirectApi)).toHaveLength(2)
  expect(screen.getByText(en.routingTestOnly)).toBeTruthy()
  view.rerender(<ServicePanel call={async () => ({ ...ready, routing: routing('deepseek-official', 'http') })} t={t} writable />)
  await screen.findByText(en.routingMessages)
  expect(screen.getByText(en.routingHttp)).toBeTruthy()
  expect(screen.getByText(en.routingPaid)).toBeTruthy()
})

it('invalidates old cost claims on refresh failure and recovers on explicit refresh', async () => {
  const call = vi.fn().mockResolvedValueOnce({ ...ready, routing: routing() }).mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ ...ready, routing: routing('searxng', 'deepseek-fetch-api') })
  render(<ServicePanel call={call} t={t} writable />)
  await screen.findByText(en.routingLocal)
  fireEvent.click(screen.getByRole('button', { name: en.routingRefresh }))
  await screen.findByText(en.routingStale)
  expect(screen.queryByText(en.routingLocal)).toBeNull()
  expect(screen.queryByText('searxng')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: en.routingRefresh }))
  await screen.findByText(en.routingPaid)
  expect(screen.getByText(en.routingDirectApi)).toBeTruthy()
})

it('does not let a slow old poll overwrite a newer status action', async () => {
  let resolveOld!: (value: ServiceStatus) => void
  const call = vi.fn().mockResolvedValueOnce({ ...ready, routing: routing() })
    .mockImplementationOnce(() => new Promise<ServiceStatus>(resolve => { resolveOld = resolve }))
    .mockResolvedValue({ ...ready, routing: routing('deepseek-search-api', 'deepseek-fetch-api') })
  render(<ServicePanel call={call} t={t} writable />)
  await screen.findByText(en.routingLocal)
  fireEvent.click(screen.getByRole('button', { name: en.routingRefresh }))
  await waitFor(() => expect(resolveOld).toBeTypeOf('function'))
  fireEvent.click(screen.getByRole('button', { name: en.serviceRestart }))
  await screen.findByText(en.routingPaid)
  resolveOld({ ...ready, routing: routing() })
  await waitFor(() => expect(screen.queryByText(en.routingLocal)).toBeNull())
})

it('shows live readiness and sends restart, test and stop through operator actions', async () => {
  const call = vi.fn(async (method: string): Promise<ServiceResponse> => method === 'testReport' ? report : method === 'stop' ? { ...ready, phase: 'stopped', endpoint: '' } : ready)
  render(<ServicePanel call={call} t={t} writable />)
  await screen.findByText(`${en.activeEndpoint}: ${ready.endpoint}`)
  fireEvent.click(screen.getByRole('button', { name: en.serviceTest }))
  await screen.findByText(`${en.serviceTestResult}: 3`)
  expect(screen.getByText('200')).toBeTruthy()
  expect(screen.getByText('JSON')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: en.serviceRestart }))
  await waitFor(() => expect(call.mock.calls.some(c => c[0] === 'restart')).toBe(true))
  await waitFor(() => expect(screen.getByRole('button', { name: en.serviceStop })).toHaveProperty('disabled', false))
  fireEvent.click(screen.getByRole('button', { name: en.serviceStop }))
  await screen.findByText(en.serviceStopped)
  expect(screen.getByText('local log')).toBeTruthy()
})

it('labels a previous success as historical after restarting on the same port', async () => {
  const instanceId = 'a'.repeat(32)
  const nextInstanceId = 'b'.repeat(32)
  const call = vi.fn(async (method: string): Promise<ServiceResponse> => method === 'testReport'
    ? { ...report, instanceId }
    : { ...ready, instanceId: method === 'restart' ? nextInstanceId : instanceId })
  render(<ServicePanel call={call} t={t} writable />)
  await screen.findByText(en.serviceReady)
  fireEvent.click(screen.getByRole('button', { name: en.serviceTest }))
  await screen.findByText(en.serviceTestResult + ': 3')
  fireEvent.click(screen.getByRole('button', { name: en.serviceRestart }))
  await screen.findByText(en.testHistorical)
  expect(screen.queryByText(en.serviceTestResult + ': 3')).toBeNull()
  expect(screen.getByText('200')).toBeTruthy()
})

it('does not present an old success as current while the local service is stopped', async () => {
  const call = vi.fn(async (method: string): Promise<ServiceResponse> => method === 'testReport' ? report
    : method === 'stop' ? { ...ready, phase: 'stopped', endpoint: '' } : ready)
  render(<ServicePanel call={call} t={t} writable />)
  await screen.findByText(en.serviceReady)
  fireEvent.click(screen.getByRole('button', { name: en.serviceTest }))
  await screen.findByText(en.serviceTestResult + ': 3')
  fireEvent.click(screen.getByRole('button', { name: en.serviceStop }))
  await screen.findByText(en.testHistorical)
  expect(screen.queryByText(en.serviceTestResult + ': 3')).toBeNull()
})

it('discloses first-use setup and invokes preparation only after the explicit button', async () => {
  const waiting: ServiceStatus = { ...ready, phase: 'needs-setup', endpoint: '', setup: { directory: '/temporary/profile/searxng', cached: false, components: [] } }
  const call = vi.fn(async (_method: string) => waiting)
  render(<ServicePanel call={call} t={t} writable />)
  await screen.findByText(en.setupSummary)
  expect(call.mock.calls).toHaveLength(1)
  expect(screen.getByRole('button', { name: en.serviceTest })).toHaveProperty('disabled', true)
  fireEvent.click(screen.getByRole('button', { name: en.servicePrepare }))
  await waitFor(() => expect(call.mock.calls.some(c => c[0] === 'prepare')).toBe(true))
})

it('requires an explicit cleanup confirmation and supports cancellation without deleting', async () => {
  const call = vi.fn(async (method: string): Promise<ServiceResponse> => method === 'cleanup' ? { ...ready, phase: 'needs-setup', endpoint: '' } : { ...ready, setup: { directory: '/temporary/profile/searxng', cached: true, components: [] } })
  render(<ServicePanel call={call} t={t} writable />)
  await screen.findByText(en.runtimeDetails)
  fireEvent.click(screen.getByText(en.runtimeDetails))
  fireEvent.click(screen.getByRole('button', { name: en.runtimeCleanup }))
  expect(call.mock.calls.some(c => c[0] === 'cleanup')).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: en.cleanupCancel }))
  expect(call.mock.calls.some(c => c[0] === 'cleanup')).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: en.runtimeCleanup }))
  fireEvent.click(screen.getByRole('button', { name: en.cleanupConfirm }))
  await waitFor(() => expect(call.mock.calls.some(c => c[0] === 'cleanup')).toBe(true))
})

it('does not expose start or stop actions for an external instance', async () => {
  render(<ServicePanel call={async () => ({ ...ready, phase: 'external' })} t={t} writable />)
  await screen.findByText(en.serviceExternal)
  expect(screen.queryByRole('button', { name: en.serviceRestart })).toBeNull()
  expect(screen.queryByRole('button', { name: en.serviceStop })).toBeNull()
})

it('never relabels a previous success as the result of a cancelled new test', async () => {
  const call: NonNullable<import('../src/client/searxng-search-card-controller.ts').SearxngSearchCardFace['serviceCall']> = async (method, signal) => {
    if (method === 'testReport') return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }))
    return { ...ready, testReport: report }
  }
  render(<ServicePanel call={call} t={t} writable />)
  await screen.findByText(en.serviceTestResult + ': 3')
  fireEvent.click(screen.getByRole('button', { name: en.serviceTest }))
  fireEvent.click(await screen.findByRole('button', { name: en.testCancel }))
  await screen.findByText(en.testCancelled)
  expect(screen.queryByText(en.serviceTestResult + ': 3')).toBeNull()
})

it('cancels pending polling on unmount and renders RPC errors', async () => {
  const signals: AbortSignal[] = []
  const { unmount } = render(<ServicePanel call={async (_method, signal) => { signals.push(signal); throw new Error('connection failed') }} t={t} writable />)
  await screen.findByText('Error: connection failed')
  unmount()
  expect(signals[0]!.aborted).toBe(true)
})

it('explains known startup messages while retaining the original output for diagnosis', async () => {
  const logs = 'DSH_SEARXNG_READY {}\nError while getting the version\nahmia: can\'t register engine\nmissing config file: limiter.toml\nX-Forwarded-For nor X-Real-IP header is set!'
  render(<ServicePanel call={async () => ({ ...ready, logs })} t={t} writable />)
  await screen.findByText(en.serviceReady)
  fireEvent.click(screen.getByText(en.serviceLogs))
  fireEvent.click(screen.getByText(en.diagnosticOutput))
  for (const key of ['logReadyHint', 'logGitHint', 'logTorHint', 'logLimiterHint', 'logForwardedHint'] as const) expect(screen.getByText(en[key])).toBeTruthy()
  expect(screen.getByRole('link', { name: en.logHelp })).toBeTruthy()
  expect(screen.getByText(/DSH_SEARXNG_READY \{\}/).tagName).toBe('PRE')
})

it('shows actionable network guidance when setup downloads fail', async () => {
  const failed: ServiceStatus = { phase: 'failed', endpoint: '', message: 'fetch failed', logs: '', setupFailure: 'network' }
  render(<ServicePanel call={async () => failed} t={t} writable />)
  await screen.findByText(en.setupNetworkFailure)
  expect(screen.queryByText(en.setupNetworkAdvice)).toBeNull()
})

it('advises the process proxy before first-use preparation', async () => {
  render(<ServicePanel call={async () => ({ phase: 'needs-setup', endpoint: '', message: '', logs: '' })} t={t} writable />)
  await screen.findByText(en.setupNetworkAdvice)
  expect(screen.queryByText(en.setupNetworkFailure)).toBeNull()
})

it('probes download endpoints from the card and renders per-target reachability', async () => {
  const needsSetup: ServiceStatus = { phase: 'needs-setup', endpoint: '', message: '', logs: '' }
  const call = vi.fn(async (method: string): Promise<ServiceResponse> => method === 'precheck'
    ? { time: new Date().toISOString(), targets: [
      { name: 'GitHub (uv / Python)', url: 'https://github.com/', ok: false, detail: 'TypeError: fetch failed', elapsedMs: 2001 },
      { name: 'codeload.github.com (SearXNG source)', url: 'https://codeload.github.com/', ok: true, detail: 'HTTP 200', elapsedMs: 120 },
    ] }
    : needsSetup)
  render(<ServicePanel call={call} t={t} writable />)
  fireEvent.click(await screen.findByRole('button', { name: en.precheckButton }))
  await screen.findByText(/GitHub \(uv \/ Python\)/)
  expect(screen.getByText(en.precheckHint)).toBeTruthy()
  expect(screen.getAllByText(en.precheckOk)).toHaveLength(1)
  expect(screen.getAllByText(en.precheckFailed)).toHaveLength(1)
  expect(call.mock.calls.some(c => c[0] === 'precheck')).toBe(true)
})

it('keeps the download check available after a classified network failure', async () => {
  const failed: ServiceStatus = { phase: 'failed', endpoint: '', message: 'fetch failed', logs: '', setupFailure: 'network' }
  render(<ServicePanel call={async () => failed} t={t} writable />)
  await screen.findByText(en.setupNetworkFailure)
  expect(screen.getByRole('button', { name: en.precheckButton })).toBeTruthy()
})
