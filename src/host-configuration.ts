/** Read live composition through public Settings/Loader views, never Web's private registries. */
import type { Context } from '@deepseek-ai/cordis'

export function hostConfiguration(ctx: Context, namespace: string, redactSecrets = true): Record<string, unknown> | undefined {
  const settings = ctx.get('settings') as { describe(options: { redactSecrets: boolean }): { ns: string; value: unknown }[] } | undefined
  const loader = ctx.get('loader') as { entries(): Iterable<{ options: { id?: string }; fiber?: { config?: unknown } }> } | undefined
  const value = settings?.describe({ redactSecrets }).find(row => row.ns === namespace)?.value
    ?? (loader ? [...loader.entries()].find(entry => entry.options.id === namespace)?.fiber?.config : undefined)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return Object.fromEntries(Object.entries(value).map(([key, field]) => [key,
    field && typeof field === 'object' && typeof Reflect.get(field, 'get') === 'function' ? Reflect.get(field, 'get').call(field) : field,
  ]))
}
