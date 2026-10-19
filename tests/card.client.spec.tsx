// @vitest-environment jsdom
/** The SearXNG search page: staged choices, custom-value preservation, fallback and resets. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSnapshotSelector } from './helpers.ts'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SettingsFieldState, SettingsFormShell } from '@deepseek-ai/dsh-client-ui-primitives'
import { SearxngSearchCard, type SearxngSearchCardProps } from '../src/client/SearxngSearchCard.tsx'
import type { SearxngSearchCardState } from '../src/client/searxng-search-card-controller.ts'
import { en } from '../src/client/locales.ts'

afterEach(cleanup)

const t = (key: keyof typeof en) => en[key]

const settled: SettingsFormShell = { available: true, writable: true, dirty: false, invalid: false, saving: false, failed: false }

function field(text: string, rest: Partial<SettingsFieldState> = {}): SettingsFieldState {
  return { text, overridden: false, invalid: false, ...rest }
}

function cardActions() {
  return { edit: vi.fn(), resetField: vi.fn(), save: vi.fn(), discard: vi.fn(), clearAuth: vi.fn() }
}

function cardStore(state: Partial<SearxngSearchCardState> = {}) {
  return createSnapshotStore<SearxngSearchCardState>({
    ...settled,
    mode: field('external'),
    managedPort: field('0'),
    baseURL: field(''),
    engines: field(''),
    language: field(''),
    authEnabled: field('false'),
    authHeaderName: field('X-API-Key'),
    authHeaderValue: field(''),
    authConfigured: false, authWritable: true, authEndpoint: '', authBusy: false, authFailed: false,
    allowOfficialFallback: field(''),
    allowOfficialApiFallback: field('false'),
    allowOfficialFetchFallback: field('false'),
    ...state,
  })
}

describe('SearxngSearchCard', () => {
  function renderCard(state: Partial<SearxngSearchCardState> = {}) {
    const store = cardStore(state)
    const actions = cardActions()
    actions.edit.mockImplementation((key: 'baseURL' | 'engines' | 'language' | 'allowOfficialFallback' | 'allowOfficialApiFallback' | 'allowOfficialFetchFallback' | 'authEnabled' | 'authHeaderName' | 'authHeaderValue', text: string) => {
      store.update(snapshot => { snapshot[key].text = text })
    })
    const props = { ...actions, view: 'page', t, useSearxngSearchCard: bindSnapshotSelector(store) } as SearxngSearchCardProps
    render(<SearxngSearchCard {...props} />)
    return actions
  }

  it('leaves both new paid API options off when only legacy fallback was enabled', () => {
    const actions = renderCard({ allowOfficialFallback: field('true') })
    expect(screen.getByRole('checkbox', { name: en.fallbackLabel })).toHaveProperty('checked', false)
    expect(screen.getByRole('checkbox', { name: en.fetchFallbackLabel })).toHaveProperty('checked', false)
    fireEvent.click(screen.getByRole('checkbox', { name: en.fetchFallbackLabel }))
    expect(actions.edit).toHaveBeenCalledWith('allowOfficialFetchFallback', 'true')
    expect(screen.getByRole('checkbox', { name: en.fallbackLabel })).toHaveProperty('checked', false)
  })

  it('renders its one-liner alone in the summary view', () => {
    const props = { ...cardActions(), view: 'summary', t, useSearxngSearchCard: bindSnapshotSelector(cardStore()) } as SearxngSearchCardProps
    render(<SearxngSearchCard {...props} />)

    expect(document.body.textContent).toBe(en.description)
    expect(screen.queryByLabelText(en.baseUrl)).toBeNull()
  })

  it('disables every field while the settings document is read-only', () => {
    renderCard({ writable: false })

    expect(screen.getByLabelText(en.baseUrl)).toHaveProperty('disabled', true)
    expect(screen.getByRole('checkbox', { name: 'Bing' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('combobox', { name: en.language })).toHaveProperty('disabled', true)
  })

  it('stages the endpoint, engines, and language, and their resets', () => {
    const actions = renderCard({
      baseURL: field('http://localhost:8080', { overridden: true }),
      engines: field('bing', { overridden: true }),
      language: field('zh-CN', { overridden: true }),
    })

    fireEvent.change(screen.getByLabelText(en.baseUrl), { target: { value: 'http://other.test' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'DuckDuckGo' }))
    fireEvent.change(screen.getByRole('combobox', { name: en.language }), { target: { value: 'en' } })
    const resets = screen.getAllByRole('button', { name: en.reset })
    expect(resets).toHaveLength(3)
    for (const reset of resets) fireEvent.click(reset)

    expect(actions.edit.mock.calls).toEqual([
      ['baseURL', 'http://other.test'],
      ['engines', 'bing,duckduckgo'],
      ['language', 'en'],
    ])
    expect(actions.resetField.mock.calls).toEqual([['baseURL'], ['language'], ['engines']])
  })

  it('shows engines grouped by purpose with instance-default selections', () => {
    renderCard()
    for (const name of [en.enginesNews, en.enginesScience, en.enginesKnowledge]) fireEvent.click(screen.getByText(name))
    for (const name of [en.enginesWeb, en.enginesNews, en.enginesScience, en.enginesKnowledge]) {
      expect(screen.getByRole('group', { name })).toBeTruthy()
    }
    expect(screen.getByText(en.enginesDefault)).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: 'Google Scholar' })).toHaveProperty('checked', false)
    expect(screen.getByRole('combobox', { name: en.language })).toHaveProperty('value', '')
  })

  it('preserves custom engines and names containing spaces when selecting another engine', () => {
    const actions = renderCard({ engines: field('google scholar,corp search') })
    expect(screen.getByRole('checkbox', { name: 'Google Scholar' })).toHaveProperty('checked', true)
    expect(screen.getByText(`${en.enginesCustomSelected}: corp search`)).toBeTruthy()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bing' }))
    expect(actions.edit.mock.calls).toEqual([['engines', 'google scholar,corp search,bing']])
  })

  it('edits custom engines without dropping the list selections', () => {
    const actions = renderCard({ engines: field('bing,corp search') })
    fireEvent.change(screen.getByLabelText(en.enginesCustomNames), { target: { value: 'new engine,google scholar,bing' } })
    expect(actions.edit.mock.calls).toEqual([['engines', 'bing,new engine,google scholar']])
  })

  it('keeps a trailing comma while typing multiple custom engines', () => {
    const actions = renderCard({ engines: field('bing,corp search') })
    const input = screen.getByLabelText(en.enginesCustomNames)
    fireEvent.change(input, { target: { value: 'corp search,' } })
    expect(input).toHaveProperty('value', 'corp search,')
    fireEvent.change(input, { target: { value: 'corp search,another engine' } })
    expect(input).toHaveProperty('value', 'corp search,another engine')
    expect(actions.edit.mock.calls).toEqual([
      ['engines', 'bing,corp search'],
      ['engines', 'bing,corp search,another engine'],
    ])
  })

  it('preserves an uncommon language and allows switching it back to a listed choice', () => {
    const actions = renderCard({ language: field('pt-BR') })
    expect(screen.getByLabelText(en.languageCustomCode)).toHaveProperty('value', 'pt-BR')
    expect(actions.edit).not.toHaveBeenCalled()
    fireEvent.change(screen.getByRole('combobox', { name: en.language }), { target: { value: 'zh-CN' } })
    expect(actions.edit.mock.calls).toEqual([['language', 'zh-CN']])
    expect(screen.queryByLabelText(en.languageCustomCode)).toBeNull()
  })

  it('allows a custom language without saving before the user enters a code', () => {
    const actions = renderCard()
    fireEvent.change(screen.getByRole('combobox', { name: en.language }), { target: { value: '__custom_language__' } })
    expect(actions.edit).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText(en.languageCustomCode), { target: { value: 'pt-BR' } })
    expect(actions.edit.mock.calls).toEqual([['language', 'pt-BR']])
    expect(actions.save).not.toHaveBeenCalled()
  })

  it('checks for updates only on click and reports a newer release', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ tag_name: 'v99.0.0' }),
    })) as unknown as typeof fetch
    vi.stubGlobal('fetch', fetchMock)
    try {
      renderCard()
      expect(fetchMock).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: en.checkUpdate }))

      expect(await screen.findByText(new RegExp(en.updateAvailable))).toBeTruthy()
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('defaults to an unchecked paid-fallback checkbox without a route status', () => {
    const actions = renderCard()
    const checkbox = screen.getByRole('checkbox', { name: en.fallbackLabel })
    expect(checkbox).toHaveProperty('checked', false)
    fireEvent.click(checkbox)
    expect(actions.edit.mock.calls).toEqual([['allowOfficialApiFallback', 'true']])
    expect(actions.save).not.toHaveBeenCalled()
    expect(actions.resetField).not.toHaveBeenCalled()
    expect(screen.queryByText('SearXNG (this plugin)')).toBeNull()
  })

  it('unchecking writes false even when the value was inherited', () => {
    const actions = renderCard({ allowOfficialApiFallback: field('true') })
    fireEvent.click(screen.getByRole('checkbox', { name: en.fallbackLabel }))
    expect(actions.edit.mock.calls).toEqual([['allowOfficialApiFallback', 'false']])
    expect(actions.resetField).not.toHaveBeenCalled()
  })

  it('renders no endpoint alert: an empty field can still mean $SEARXNG_BASE_URL', () => {
    // The removed alert inferred a missing endpoint from the blank text
    // field alone and cried wolf whenever the endpoint came from the
    // environment. Unavailability now surfaces at search time, per request.
    renderCard()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('explains that the Plugins page owns the route', () => {
    renderCard()
    expect(screen.getByText(en.routeHint)).toBeTruthy()
  })

  it('stages defaults for every field via the reset-all button', () => {
    const actions = renderCard({
      baseURL: field('http://localhost:8080', { overridden: true }),
      allowOfficialFallback: field('true', { overridden: true }),
    })
    const button = screen.getByRole('button', { name: en.resetAll })
    expect(button).toHaveProperty('disabled', false)
    fireEvent.click(button)
    expect(actions.resetField.mock.calls)
      .toEqual([['mode'], ['managedPort'], ['baseURL'], ['engines'], ['language'], ['authEnabled'], ['authHeaderName'], ['allowOfficialFallback'], ['allowOfficialApiFallback'], ['allowOfficialFetchFallback']])
    // Staged only: the form's own save button commits, like per-field resets.
    expect(actions.save).not.toHaveBeenCalled()
  })

  it('disables reset-all when nothing is overridden or the form is read-only', () => {
    renderCard()
    expect(screen.getByRole('button', { name: en.resetAll })).toHaveProperty('disabled', true)
    cleanup()
    renderCard({ writable: false, engines: field('bing', { overridden: true }) })
    expect(screen.getByRole('button', { name: en.resetAll })).toHaveProperty('disabled', true)
  })

  it('disables fallback while unavailable, read-only, or saving', () => {
    for (const state of [{ available: false }, { writable: false }, { saving: true }]) {
      renderCard(state)
      if (state.available === false) expect(screen.queryByRole('checkbox')).toBeNull()
      else expect(screen.getByRole('checkbox', { name: en.fallbackLabel })).toHaveProperty('disabled', true)
      cleanup()
    }
  })

  it('keeps instance authentication off and explains the credential-free default', () => {
    renderCard()
    fireEvent.click(screen.getByText(en.authTitle))
    expect(screen.getByRole('checkbox', { name: en.authEnabled })).toHaveProperty('checked', false)
    expect(screen.getByText(en.authDefaultHint)).toBeTruthy()
    expect(screen.queryByLabelText(en.authHeaderValue)).toBeNull()
  })

  it('stages custom authentication headers with a masked write-only value', () => {
    const actions = renderCard({ authEnabled: field('true'), authConfigured: true })
    const input = screen.getByLabelText(en.authHeaderValue)
    expect(input).toHaveProperty('type', 'password')
    expect(input).toHaveProperty('value', '')
    expect(input.getAttribute('autocomplete')).toBe('new-password')
    expect(screen.getByText(en.authConfigured)).toBeTruthy()
    fireEvent.change(screen.getByLabelText(en.authHeaderName), { target: { value: 'Authorization' } })
    fireEvent.change(input, { target: { value: 'Bearer example-token' } })
    expect(actions.edit.mock.calls).toEqual([['authHeaderName', 'Authorization'], ['authHeaderValue', 'Bearer example-token']])
    expect(actions.save).not.toHaveBeenCalled()
  })

  it('shows the no-key default for local mode and never offers credential fields there', () => {
    renderCard({ mode: field('local'), authEnabled: field('true'), baseURL: field('https://existing.test') })
    expect(screen.getByText(en.authDefaultHint)).toBeTruthy()
    expect(screen.queryByRole('checkbox', { name: en.authEnabled })).toBeNull()
    expect(screen.queryByLabelText(en.authHeaderValue)).toBeNull()
  })

  it('offers authentication for an automatic-mode instance supplied by the environment', () => {
    renderCard({ mode: field('auto'), authEndpoint: 'https://env-instance.test/' })
    fireEvent.click(screen.getByText(en.authTitle))
    expect(screen.getByRole('checkbox', { name: en.authEnabled })).toBeTruthy()
  })

  it('disables credential edits and removal while read-only or when drafts are unsaved', () => {
    renderCard({ authEnabled: field('true'), authConfigured: true, writable: false })
    expect(screen.getByLabelText(en.authHeaderValue)).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: en.authClear })).toHaveProperty('disabled', true)
    cleanup()
    renderCard({ authEnabled: field('true'), authConfigured: true, dirty: true })
    expect(screen.getByRole('button', { name: en.authClear })).toHaveProperty('disabled', true)
  })

  it('keeps the proxy risk area visible and separate after the saved settings and version', () => {
    renderCard()
    const risk = screen.getByRole('region', { name: en.proxyTitle })
    expect(risk.parentElement?.lastElementChild).toBe(risk)
    expect(screen.getByRole('heading', { name: en.proxyTitle })).toBeTruthy()
    expect(screen.getByText(en.proxyPortGuide)).toBeTruthy()
    expect(screen.getByLabelText(en.proxyPort)).toHaveProperty('value', '')
  })
})
