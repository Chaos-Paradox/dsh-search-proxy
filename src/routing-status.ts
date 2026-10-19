/** Public configuration views only; no request probes or private Web registries. */
import type { Context } from '@deepseek-ai/cordis'
import type { RouteSource, RoutingStatus } from './runtime-types.ts'

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,99}$/i.test(value)

export function readRoutingStatus(ctx: Context, environment: { searchProvider?: string; fetchProvider?: string }, fallback?: RoutingStatus['fallback']): RoutingStatus {
  const selection = (field: 'searchProvider' | 'fetchProvider'): { provider: string | null; source: RouteSource } => {
    try {
      // rc.2 exposes its live configuration as a public property. alpha.2's
      // public Loader view supplies the constructor config for its fixed route.
      const web = ctx.get('web') as unknown as { config?: unknown } | undefined
      const loader = ctx.get('loader') as { entries(): Iterable<{ options: { id?: string }; fiber?: { config?: unknown } }> } | undefined
      const settings = ctx.get('settings') as { describe(options: { redactSecrets: boolean }): { ns: string; value: unknown }[] } | undefined
      const value = web?.config ?? (loader ? [...loader.entries()].find(entry => entry.options.id === 'web')?.fiber?.config : undefined)
        ?? settings?.describe({ redactSecrets: true }).find(row => row.ns === 'web')?.value
      if (!object(value)) return { provider: null, source: 'unavailable' }
      const fieldValue = value[field]
      const resolved: unknown = object(fieldValue) && typeof fieldValue.get === 'function' ? fieldValue.get() : fieldValue
      if (resolved !== undefined && resolved !== null) return validId(resolved)
        ? { provider: resolved, source: 'configuration' } : { provider: null, source: 'unavailable' }
      // Both audited hosts snapshot process.env in Web's constructor. They do
      // not expose that snapshot; a plugin cannot certify the environment route.
      const candidate = environment[field]
      if (candidate !== undefined) return { provider: validId(candidate) ? candidate : null, source: 'environment' }
      return { provider: null, source: 'automatic' }
    } catch { return { provider: null, source: 'unavailable' } }
  }
  const search = selection('searchProvider'), fetch = selection('fetchProvider')
  return { searchProvider: search.provider, fetchProvider: fetch.provider, searchSource: search.source, fetchSource: fetch.source,
    ...fallback ? { fallback } : {} }
}
