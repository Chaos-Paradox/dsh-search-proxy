// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ProxyPanel } from '../src/client/ProxyPanel.tsx'
import { en } from '../src/client/locales.ts'
import { PROXY_RISK_REVISION, PROXY_RISK_URL } from '../src/proxy-types.ts'
import type { ProxyCall, ProxyConfiguration } from '../src/proxy-types.ts'

afterEach(cleanup)

const savedConfiguration: ProxyConfiguration = { protocol: 'https', host: 'saved-proxy.example', port: 443, noProxy: '.direct.example' }

it('fills remembered fields automatically, keeps them visible while active and resumes unchanged consent', async () => {
  const call = operator(false, savedConfiguration)
  render(<ProxyPanel call={call} writable t={key => en[key]} />)
  await screen.findByText(en.proxyRemembered)
  expect(screen.getByLabelText(en.proxyHost)).toHaveProperty('value', savedConfiguration.host)
  expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '443')
  expect(screen.getByLabelText(en.proxyProtocol)).toHaveProperty('value', 'https')
  expect(screen.getByLabelText(en.proxyBypass)).toHaveProperty('value', savedConfiguration.noProxy)
  fireEvent.click(screen.getByRole('switch', { name: en.proxyToggle }))
  await screen.findByRole('button', { name: en.proxyRemove })
  expect(call).toHaveBeenLastCalledWith('proxyResume', {})
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByLabelText(en.proxyHost)).toHaveProperty('value', savedConfiguration.host)
  fireEvent.click(screen.getByRole('switch', { name: en.proxyToggle }))
  await waitFor(() => expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false'))
  expect(screen.getByLabelText(en.proxyHost)).toHaveProperty('value', savedConfiguration.host)
  fireEvent.click(screen.getByRole('button', { name: en.proxyForget }))
  await waitFor(() => expect(screen.getByLabelText(en.proxyHost)).toHaveProperty('value', ''))
  expect(call).toHaveBeenLastCalledWith('proxyForget', {})
  expect(screen.getByLabelText(en.proxyHost)).toHaveProperty('value', '')
})

function operator(failAfterApply = false, initial?: ProxyConfiguration, initiallyActive = false) {
  let active = initiallyActive, saved = initial
  return vi.fn<ProxyCall>(async (method, args) => {
    const status = () => ({ state: active ? 'active' as const : 'off' as const, remembered: !!saved, riskRevision: PROXY_RISK_REVISION })
    if (method === 'proxyStatus') return status()
    if (method === 'proxyDescribe') return { ...status(), ...saved ? { configuration: saved } : {} }
    if (method === 'proxyResume') { active = true; return status() }
    if (method === 'proxyRemove') { active = false; return status() }
    if (method === 'proxyForget') { active = false; saved = undefined; return status() }
    if (method === 'proxyApply') {
      active = true
      saved = args.configuration as ProxyConfiguration
      if (failAfterApply) throw new Error('private deployment detail')
      return status()
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
  expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '1')
  fireEvent.click(toggle)
  await screen.findByLabelText(en.proxyPort)
  expect(toggle.getAttribute('aria-checked')).toBe('false')
  expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '1')
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
  expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '1')
})

it('updates an active proxy only after explicit update and fresh consent, then refills it after remount', async () => {
  const call = operator(false, savedConfiguration, true)
  const view = render(<ProxyPanel call={call} writable t={key => en[key]} />)
  await screen.findByText(en.proxyRemembered)
  fireEvent.change(screen.getByLabelText(en.proxyHost), { target: { value: 'updated-proxy.example' } })
  fireEvent.change(screen.getByLabelText(en.proxyPort), { target: { value: '8443' } })
  fireEvent.change(screen.getByLabelText(en.proxyProtocol), { target: { value: 'http' } })
  fireEvent.change(screen.getByLabelText(en.proxyBypass), { target: { value: 'direct.example' } })
  expect(call).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: en.proxyUpdate }))
  const dialog = await screen.findByRole('dialog')
  expect(call.mock.calls.slice(-2)).toEqual([['proxyRemove', {}], ['proxyBegin', {}]])
  expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false')
  await readStatement()
  fireEvent.click(within(dialog).getByRole('checkbox', { name: en.proxyAck }))
  fireEvent.click(within(dialog).getByRole('button', { name: en.proxyApply }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  const configuration = { protocol: 'http', host: 'updated-proxy.example', port: 8443, noProxy: 'direct.example' }
  expect(call).toHaveBeenLastCalledWith('proxyApply', { token: 'c'.repeat(64), configuration })
  expect(screen.queryByRole('button', { name: en.proxyUpdate })).toBeNull()
  view.unmount()
  render(<ProxyPanel call={call} writable t={key => en[key]} />)
  await waitFor(() => expect(screen.getByLabelText(en.proxyHost)).toHaveProperty('value', configuration.host))
  expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '8443')
})

it.each([false, true])('keeps saved defaults when cancelling an edit (initially active: %s)', async active => {
  const call = operator(false, savedConfiguration, active)
  const view = render(<ProxyPanel call={call} writable t={key => en[key]} />)
  await screen.findByText(en.proxyRemembered)
  fireEvent.change(screen.getByLabelText(en.proxyPort), { target: { value: '8443' } })
  fireEvent.click(active ? screen.getByRole('button', { name: en.proxyUpdate }) : screen.getByRole('switch'))
  const dialog = await screen.findByRole('dialog')
  expect(call.mock.calls.some(([method]) => method === 'proxyResume')).toBe(false)
  fireEvent.click(within(dialog).getByRole('button', { name: en.proxyCancel }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false')
  expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '8443')
  view.unmount()
  render(<ProxyPanel call={call} writable t={key => en[key]} />)
  await waitFor(() => expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '443'))
})

it('preserves edited saved defaults across slot callback refreshes and rejects invalid updates before stopping the proxy', async () => {
  const call = operator(false, savedConfiguration, true)
  const view = render(<ProxyPanel call={call} writable t={key => en[key]} />)
  await screen.findByText(en.proxyRemembered)
  fireEvent.change(screen.getByLabelText(en.proxyPort), { target: { value: '' } })
  view.rerender(<ProxyPanel call={(method, args) => call(method, args)} writable t={key => en[key]} />)
  await waitFor(() => expect(call).toHaveBeenCalledTimes(2))
  expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '')
  fireEvent.click(screen.getByRole('button', { name: en.proxyUpdate }))
  expect(screen.getByRole('alert').textContent).toBe(en.proxyConfigRequired)
  expect(call.mock.calls.some(([method]) => method === 'proxyRemove')).toBe(false)
})

it('shows saved settings on a read-only page without allowing updates', async () => {
  render(<ProxyPanel call={operator(false, savedConfiguration, true)} writable={false} t={key => en[key]} />)
  await screen.findByText(en.proxyRemembered)
  expect(screen.getByLabelText(en.proxyHost)).toHaveProperty('value', savedConfiguration.host)
  expect(screen.getByLabelText(en.proxyHost).closest('fieldset')).toHaveProperty('disabled', true)
})
