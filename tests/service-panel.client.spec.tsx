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
  await screen.findByText(`${en.serviceTitle}: ${en.serviceStopped}`)
  expect(screen.getByText('local log')).toBeTruthy()
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
  await screen.findByText(`${en.serviceTitle}: ${en.serviceExternal}`)
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
  await screen.findByRole('alert')
  unmount()
  expect(signals[0]!.aborted).toBe(true)
})
