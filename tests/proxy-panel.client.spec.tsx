// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ProxyPanel } from '../src/client/ProxyPanel.tsx'
import { en } from '../src/client/locales.ts'
import { PROXY_RISK_REVISION, PROXY_RISK_URL } from '../src/proxy-types.ts'
import type { ProxyCall } from '../src/proxy-types.ts'

afterEach(cleanup)

it('reuses remembered consent without an endpoint form or risk dialog and exposes an explicit forget action', async () => {
  let active = false, remembered = true
  const call = vi.fn<ProxyCall>(async method => {
    if (method === 'proxyResume') active = true
    if (method === 'proxyRemove') active = false
    if (method === 'proxyForget') { active = false; remembered = false }
    return { state: active ? 'active' : 'off', remembered, riskRevision: PROXY_RISK_REVISION }
  })
  render(<ProxyPanel call={call} writable t={key => en[key]} />)
  await screen.findByText(en.proxyRemembered)
  expect(screen.queryByLabelText(en.proxyHost)).toBeNull()
  fireEvent.click(screen.getByRole('switch', { name: en.proxyToggle }))
  await screen.findByRole('button', { name: en.proxyRemove })
  expect(call).toHaveBeenLastCalledWith('proxyResume', {})
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: en.proxyForget }))
  await screen.findByLabelText(en.proxyHost)
  expect(call).toHaveBeenLastCalledWith('proxyForget', {})
  expect(screen.getByLabelText(en.proxyHost)).toHaveProperty('value', '')
})

function operator(failAfterApply = false) {
  let active = false
  return vi.fn<ProxyCall>(async (method, args) => {
    if (method === 'proxyStatus') return { state: active ? 'active' : 'off', riskRevision: PROXY_RISK_REVISION }
    if (method === 'proxyRemove') { active = false; return { state: 'off', riskRevision: PROXY_RISK_REVISION } }
    if (method === 'proxyApply') {
      active = true
      if (failAfterApply) throw new Error('private deployment detail')
      return { state: 'active', riskRevision: PROXY_RISK_REVISION }
    }
    const step = method === 'proxyBegin' ? 'notice' : args.step === 'notice' ? 'statement' : 'approved'
    return { step, token: (step === 'notice' ? 'a' : step === 'statement' ? 'b' : 'c').repeat(64), riskRevision: PROXY_RISK_REVISION }
  })
}
async function configure() {
  const toggle = screen.getByRole('switch', { name: en.proxyToggle })
  await waitFor(() => expect(toggle).toHaveProperty('disabled', false))
  fireEvent.change(screen.getByLabelText(en.proxyHost), { target: { value: 'operator-proxy.example' } })
  fireEvent.change(screen.getByLabelText(en.proxyPort), { target: { value: '1' } })
  fireEvent.click(toggle)
  return screen.findByRole('dialog', { name: en.proxyDialogTitle })
}
async function readStatement() {
  fireEvent.click(screen.getByRole('button', { name: en.proxyReadStatement }))
  await screen.findByRole('region', { name: en.proxyStatementTitle })
}

it('shows blank proxy fields immediately; the switch opens a statement and checkbox gate without changing routing', async () => {
  const call = operator()
  render(<ProxyPanel call={call} writable t={key => en[key]} />)
  expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '')
  expect(screen.getByLabelText(en.proxyHost)).toHaveProperty('value', '')
  const toggle = screen.getByRole('switch', { name: en.proxyToggle })
  await waitFor(() => expect(toggle).toHaveProperty('disabled', false))
  fireEvent.click(toggle)
  expect(screen.getByRole('alert').textContent).toBe(en.proxyConfigRequired)
  expect(call.mock.calls.some(([method]) => method === 'proxyBegin')).toBe(false)
  const dialog = await configure()
  expect(toggle.getAttribute('aria-checked')).toBe('false')
  expect(within(dialog).getByRole('checkbox', { name: en.proxyAck })).toHaveProperty('disabled', true)
  expect(within(dialog).getByRole('button', { name: en.proxyApply })).toHaveProperty('disabled', true)
  expect(call.mock.calls.some(([method]) => method === 'proxyApply')).toBe(false)
  await readStatement()
  const ack = within(dialog).getByRole('checkbox', { name: en.proxyAck })
  expect(ack).toHaveProperty('checked', false)
  expect(ack).toHaveProperty('disabled', false)
  expect(within(dialog).getByRole('link', { name: en.proxyDocs }).getAttribute('href')).toBe(PROXY_RISK_URL)
  fireEvent.click(ack)
  expect(call.mock.calls.some(([method]) => method === 'proxyApply')).toBe(false)
  fireEvent.click(within(dialog).getByRole('button', { name: en.proxyApply }))
  await screen.findByRole('button', { name: en.proxyRemove })
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(toggle.getAttribute('aria-checked')).toBe('true')
  expect(call.mock.calls).toContainEqual(['proxyConfirm', { token: 'a'.repeat(64), step: 'notice', revision: PROXY_RISK_REVISION, accepted: false }])
  expect(call.mock.calls).toContainEqual(['proxyConfirm', { token: 'b'.repeat(64), step: 'statement', revision: PROXY_RISK_REVISION, accepted: true }])
  expect(call).toHaveBeenLastCalledWith('proxyApply', { token: 'c'.repeat(64), configuration: { protocol: 'http', host: 'operator-proxy.example', port: 1, noProxy: '' } })
  expect(screen.queryByLabelText(en.proxyPort)).toBeNull()
  fireEvent.click(toggle)
  await screen.findByLabelText(en.proxyPort)
  expect(toggle.getAttribute('aria-checked')).toBe('false')
  expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '')
})

it('cancel and Escape revoke consent, retain the unsubmitted draft and reset reading and acknowledgement', async () => {
  const call = operator()
  render(<ProxyPanel call={call} writable t={key => en[key]} />)
  const first = await configure()
  await readStatement()
  fireEvent.click(within(first).getByRole('checkbox', { name: en.proxyAck }))
  fireEvent.click(within(first).getByRole('button', { name: en.proxyCancel }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(call).toHaveBeenLastCalledWith('proxyRemove', {})
  expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '1')
  fireEvent.click(screen.getByRole('switch', { name: en.proxyToggle }))
  const second = await screen.findByRole('dialog')
  expect(within(second).getByRole('checkbox', { name: en.proxyAck })).toHaveProperty('checked', false)
  expect(within(second).getByRole('checkbox', { name: en.proxyAck })).toHaveProperty('disabled', true)
  fireEvent.keyDown(document, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(call.mock.calls.some(([method]) => method === 'proxyApply')).toBe(false)
})

it('locks the switch and fields when an inherited proxy exists or the page is read-only', async () => {
  const call = vi.fn<ProxyCall>(async () => ({ state: 'inherited', riskRevision: PROXY_RISK_REVISION }))
  render(<ProxyPanel call={call} writable={false} t={key => en[key]} />)
  await screen.findByText(en.proxyInherited)
  expect(screen.getByRole('switch', { name: en.proxyToggle })).toHaveProperty('disabled', true)
  expect(screen.getByLabelText(en.proxyPort).closest('fieldset')).toHaveProperty('disabled', true)
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('preserves an open statement and acknowledgement across host slot callback refreshes', async () => {
  const call = operator()
  const view = render(<ProxyPanel call={call} writable t={key => en[key]} />)
  await configure()
  await readStatement()
  fireEvent.click(screen.getByRole('checkbox', { name: en.proxyAck }))
  view.rerender(<ProxyPanel call={(method, args) => call(method, args)} writable t={key => en[key]} />)
  await waitFor(() => expect(screen.getByRole('button', { name: en.proxyApply })).toHaveProperty('disabled', false))
  expect(screen.getByRole('checkbox', { name: en.proxyAck })).toHaveProperty('checked', true)
  expect(screen.getByRole('region', { name: en.proxyStatementTitle })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: en.proxyApply }))
  await screen.findByRole('button', { name: en.proxyRemove })
})

it('reconciles activation after a transport failure so removal remains reachable without leaking the error', async () => {
  const call = operator(true)
  render(<ProxyPanel call={call} writable t={key => en[key]} />)
  await configure()
  await readStatement()
  fireEvent.click(screen.getByRole('checkbox', { name: en.proxyAck }))
  fireEvent.click(screen.getByRole('button', { name: en.proxyApply }))
  await screen.findByRole('button', { name: en.proxyRemove })
  expect(screen.getByRole('switch', { name: en.proxyToggle }).getAttribute('aria-checked')).toBe('true')
  expect(screen.queryByText('private deployment detail')).toBeNull()
  expect(screen.queryByLabelText(en.proxyPort)).toBeNull()
})
