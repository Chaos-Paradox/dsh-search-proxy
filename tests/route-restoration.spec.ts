import { Context } from '@deepseek-ai/cordis'
import { expect, it, vi } from 'vitest'
import { restorePluginRoutes, routeRestoreStatus } from '../src/route-restoration.ts'
import { parseRouteRestoreResult, parseServiceStatus } from '../src/runtime-types.ts'
import type { RoutingStatus } from '../src/runtime-types.ts'

function fixture() {
  const ctx = new Context()
  let routing: RoutingStatus = { searchProvider: 'deepseek-search-api', fetchProvider: 'deepseek-fetch-api', searchSource: 'configuration', fetchSource: 'configuration', fallback: { searchApi: true, fetchApi: false, legacySearch: false } }
  const entry = { options: { id: 'web' } }
  const raw = { searchProvider: 'deepseek-search-api', fetchProvider: 'deepseek-fetch-api', other: 'preserved' }
  const edit = vi.fn(async (_entry: unknown, change: (current: Record<string, unknown>) => Record<string, unknown>) => {
    const next = change(raw)
    Object.assign(raw, next)
    routing = { ...routing, searchProvider: String(next.searchProvider), fetchProvider: String(next.fetchProvider) }
  })
  const editor = { entries: () => [entry], edit }
  const settings = { writable: true }
  ctx.provide('settings', settings)
  ctx.provide('configEditor', editor)
  return { ctx, edit, raw, settings, read: () => routing, revise: (next: Partial<RoutingStatus>) => { routing = { ...routing, ...next } } }
}

it('only writes the two fixed routes, preserves other fields and paid permissions, and verifies the final snapshot', async () => {
  const f = fixture(), before = f.read().fallback
  const status = routeRestoreStatus(f.ctx, f.read())
  expect(status.capability).toBe('available')
  expect(status.revision).toMatch(/^[a-f0-9]{64}$/)
  expect(f.edit).not.toHaveBeenCalled()
  const result = await restorePluginRoutes(f.ctx, status.revision, f.read)
  expect(result.outcome).toBe('restored')
  expect(f.edit).toHaveBeenCalledTimes(1)
  expect(f.raw).toEqual({ searchProvider: 'searxng', fetchProvider: 'searxng-http', other: 'preserved' })
  expect(result.routing.fallback).toBe(before)
})

it('refuses a changed selection or permission before writing, including changes inside the editor lock', async () => {
  const f = fixture(), revision = routeRestoreStatus(f.ctx, f.read()).revision
  f.revise({ fetchProvider: 'http' })
  expect((await restorePluginRoutes(f.ctx, revision, f.read)).outcome).toBe('changed')
  expect(f.edit).not.toHaveBeenCalled()
  const next = routeRestoreStatus(f.ctx, f.read()).revision
  f.edit.mockImplementationOnce(async (_entry, change) => {
    f.revise({ fallback: { searchApi: false, fetchApi: false, legacySearch: false } })
    change(f.raw)
  })
  expect((await restorePluginRoutes(f.ctx, next, f.read)).outcome).toBe('changed')
  expect(f.raw.searchProvider).toBe('deepseek-search-api')
})

it('respects read-only and missing capabilities without a filesystem workaround', async () => {
  const f = fixture(), revision = routeRestoreStatus(f.ctx, f.read()).revision
  f.settings.writable = false
  expect((await restorePluginRoutes(f.ctx, revision, f.read)).outcome).toBe('read-only')
  expect(f.edit).not.toHaveBeenCalled()
  const ctx = new Context()
  expect((await restorePluginRoutes(ctx, revision, f.read)).outcome).toBe('unavailable')
})

it('reports higher-priority refusal and bounded failures without copying error details or assuming persistence succeeded', async () => {
  const f = fixture(), revision = routeRestoreStatus(f.ctx, f.read()).revision
  f.edit.mockRejectedValueOnce(new Error('Configuration for "web" is overridden by a home patch or command-line overlay'))
  expect((await restorePluginRoutes(f.ctx, revision, f.read)).outcome).toBe('blocked')
  f.edit.mockRejectedValueOnce(new Error('private-path-and-secret'))
  const result = await restorePluginRoutes(f.ctx, revision, f.read)
  expect(result.outcome).toBe('failed')
  expect(JSON.stringify(result)).not.toContain('private-path')
  f.edit.mockResolvedValueOnce(undefined)
  expect((await restorePluginRoutes(f.ctx, revision, f.read)).outcome).toBe('failed')
})

it('validates capability and restoration results across RPC', () => {
  const f = fixture()
  expect(parseRouteRestoreResult({ outcome: 'blocked', routing: f.read() }).outcome).toBe('blocked')
  expect(() => parseRouteRestoreResult({ outcome: 'restored', routing: {} })).toThrow()
  expect(() => parseServiceStatus({ phase: 'idle', endpoint: '', message: '', logs: '', routeRestore: { capability: 'available', revision: 'bad' } })).toThrow()
})
