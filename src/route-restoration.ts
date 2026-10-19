/** Explicit operator action through the host's public atomic configuration editor. */
import { createHash } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { RouteRestoreResult, RouteRestoreStatus, RoutingStatus } from './runtime-types.ts'

type Entry = { options: { id?: string } }
type Editor = { entries(): Entry[]; edit(entry: Entry, change: (current: Record<string, unknown>) => Record<string, unknown>): Promise<void> }

function capability(ctx: Context): { capability: RouteRestoreStatus['capability']; editor?: Editor; entry?: Entry } {
  try {
    const settings = ctx.get('settings') as { writable?: boolean } | undefined
    if (settings?.writable === false) return { capability: 'read-only' }
    const editor = ctx.get('configEditor') as Editor | undefined
    if (settings?.writable !== true || typeof editor?.entries !== 'function' || typeof editor.edit !== 'function') return { capability: 'unavailable' }
    const entries = editor.entries().filter(entry => entry.options.id === 'web')
    if (entries.length !== 1) return { capability: 'unavailable' }
    return { capability: 'available', editor, entry: entries[0] }
  } catch { return { capability: 'unavailable' } }
}

function revision(routing: RoutingStatus): string {
  return createHash('sha256').update(JSON.stringify([routing.searchProvider, routing.fetchProvider, routing.searchSource,
    routing.fetchSource, routing.fallback?.searchApi, routing.fallback?.fetchApi, routing.fallback?.legacySearch])).digest('hex')
}

export function routeRestoreStatus(ctx: Context, routing: RoutingStatus): RouteRestoreStatus {
  return { capability: capability(ctx).capability, revision: revision(routing) }
}

export async function restorePluginRoutes(ctx: Context, expectedRevision: string, read: () => RoutingStatus): Promise<RouteRestoreResult> {
  const current = () => read()
  const result = (outcome: RouteRestoreResult['outcome']): RouteRestoreResult => ({ outcome, routing: current() })
  if (!/^[a-f0-9]{64}$/.test(expectedRevision) || revision(current()) !== expectedRevision) return result('changed')
  const target = capability(ctx)
  if (target.capability !== 'available') return result(target.capability)
  try {
    await target.editor!.edit(target.entry!, raw => {
      // The editor serializes reload and persistence. Recheck here so another
      // settings page cannot change paid permission after the user reviewed it.
      if (revision(current()) !== expectedRevision) throw new Error('SEARXNG_ROUTE_RESTORE_CHANGED')
      if (capability(ctx).capability !== 'available') throw new Error('SEARXNG_ROUTE_RESTORE_READ_ONLY')
      return { ...raw, searchProvider: 'searxng', fetchProvider: 'searxng-http' }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'SEARXNG_ROUTE_RESTORE_CHANGED' || /entry changed|entry is no longer|plugin is no longer/i.test(message)) return result('changed')
    if (message === 'SEARXNG_ROUTE_RESTORE_READ_ONLY') return result('read-only')
    if (/overridden by a home patch or command-line overlay/i.test(message)) return result('blocked')
    return result('failed')
  }
  const next = result('failed')
  if (next.routing.searchSource === 'configuration' && next.routing.fetchSource === 'configuration'
    && next.routing.searchProvider === 'searxng' && next.routing.fetchProvider === 'searxng-http') next.outcome = 'restored'
  return next
}
