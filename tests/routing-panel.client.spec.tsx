// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { RoutingPanel } from '../src/client/RoutingPanel.tsx'
import type { RoutingStatus } from '../src/runtime-types.ts'
import { en } from '../src/client/locales.ts'
import type { RouteRestoreResult } from '../src/runtime-types.ts'
afterEach(cleanup)
const t = (key: keyof typeof en) => en[key]
const baseline: RoutingStatus = { searchProvider: 'searxng', fetchProvider: 'searxng-http', searchSource: 'configuration', fetchSource: 'configuration', fallback: { searchApi: false, fetchApi: false, legacySearch: false } }
function show(routing: RoutingStatus) { render(<RoutingPanel routing={routing} fresh checkedAt={Date.now()} failed={false} refresh={() => {}} canRefresh t={t} />) }

it('shows each saved fallback separately, including a legacy permission hidden in the main form', () => {
  show({ ...baseline, fallback: { searchApi: false, fetchApi: true, legacySearch: true } })
  expect(screen.getByText(en.routingPaid)).toBeTruthy()
  expect(screen.getByText(en.routingFallbackOn)).toBeTruthy()
  expect(screen.getByText(en.routingLegacyOn)).toBeTruthy()
})

it.each(['environment', 'automatic', 'unavailable'] as const)('never labels %s selection free, even with a familiar provider id', source => {
  show({ ...baseline, searchSource: source })
  expect(screen.queryByText(en.routingLocal)).toBeNull()
  expect(screen.getByText(en.routingUnconfirmed)).toBeTruthy()
})

it('does not imply a custom provider is free or a disabled flag blocks a direct API route', () => {
  show({ ...baseline, searchProvider: 'custom-provider', fetchProvider: 'deepseek-fetch-api' })
  expect(screen.getByText(en.routingOther)).toBeTruthy()
  expect(screen.getByText(en.routingDirectApi)).toBeTruthy()
  expect(screen.queryByText(en.routingLocal)).toBeNull()
})

it('treats a saved plugin route without permission metadata as unconfirmed', () => {
  show({ ...baseline, fallback: undefined })
  expect(screen.getAllByText(en.routingPermissionUnknown)).toHaveLength(2)
  expect(screen.queryByText(en.routingLocal)).toBeNull()
})

const overridden = { ...baseline, searchProvider: 'deepseek-search-api', fetchProvider: 'deepseek-fetch-api' }
const available = { capability: 'available' as const, revision: 'a'.repeat(64) }

it('requires review and supports cancellation, then dispatches one restoration with the reviewed revision', async () => {
  const restore = vi.fn(async (): Promise<RouteRestoreResult> => ({ outcome: 'restored', routing: baseline }))
  const refresh = vi.fn()
  render(<RoutingPanel routing={overridden} routeRestore={available} restore={restore} fresh checkedAt={1} failed={false} refresh={refresh} canRefresh writable t={t} />)
  fireEvent.click(screen.getByRole('button', { name: en.routeRestoreButton }))
  expect(screen.getAllByText(en.routeRestoreKeepPermissions)).toHaveLength(2)
  expect(restore).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: en.routeRestoreCancel }))
  expect(restore).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: en.routeRestoreButton }))
  fireEvent.click(screen.getByRole('button', { name: en.routeRestoreConfirm }))
  await screen.findByText(en.routeRestoreSuccess)
  expect(restore).toHaveBeenCalledTimes(1)
  expect(restore.mock.calls[0]).toEqual([available.revision, expect.any(AbortSignal)])
  expect(refresh).toHaveBeenCalledTimes(1)
})

it('disables an open confirmation when the reviewed route or permission snapshot changes', () => {
  const restore = vi.fn()
  const props = { routing: overridden, restore, fresh: true, checkedAt: 1, failed: false, refresh: vi.fn(), canRefresh: true, writable: true, t }
  const view = render(<RoutingPanel {...props} routeRestore={available} />)
  fireEvent.click(screen.getByRole('button', { name: en.routeRestoreButton }))
  view.rerender(<RoutingPanel {...props} routeRestore={{ ...available, revision: 'b'.repeat(64) }} />)
  expect(screen.getByText(en.routeRestoreChanged)).toBeTruthy()
  expect(screen.getByRole('button', { name: en.routeRestoreConfirm })).toHaveProperty('disabled', true)
  expect(restore).not.toHaveBeenCalled()
})

it.each(['blocked', 'changed', 'failed'] as const)('shows an actionable %s result without announcing success', async outcome => {
  render(<RoutingPanel routing={overridden} routeRestore={available} restore={async () => ({ outcome, routing: overridden })} fresh checkedAt={1} failed={false} refresh={() => {}} canRefresh writable t={t} />)
  fireEvent.click(screen.getByRole('button', { name: en.routeRestoreButton }))
  fireEvent.click(screen.getByRole('button', { name: en.routeRestoreConfirm }))
  const key = { blocked: 'routeRestoreBlocked', changed: 'routeRestoreChanged', failed: 'routeRestoreFailed' } as const
  expect((await screen.findByRole('alert')).textContent).toBe(en[key[outcome]])
  expect(screen.queryByText(en.routeRestoreSuccess)).toBeNull()
  fireEvent.click(screen.getByText(en.routeRestoreManual))
  expect(screen.getByText(/searchProvider: searxng/)).toBeTruthy()
})

it('provides manual steps and disables writes for read-only and unsaved forms', () => {
  const props = { routing: overridden, routeRestore: available, restore: vi.fn(), fresh: true, checkedAt: 1, failed: false, refresh: vi.fn(), canRefresh: true, t }
  const view = render(<RoutingPanel {...props} writable={false} />)
  expect(screen.getByRole('button', { name: en.routeRestoreButton })).toHaveProperty('disabled', true)
  expect(screen.getByText(en.routeRestoreReadOnly)).toBeTruthy()
  view.rerender(<RoutingPanel {...props} writable draft />)
  expect(screen.getByRole('button', { name: en.routeRestoreButton })).toHaveProperty('disabled', true)
  expect(screen.getByText(en.routeRestoreDraft)).toBeTruthy()
})
