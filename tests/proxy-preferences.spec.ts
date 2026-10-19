import { Context } from '@deepseek-ai/cordis'
import type { CredentialRecord } from '@deepseek-ai/dsh-credentials'
import { expect, it } from 'vitest'
import { ProxyPreferenceStore } from '../src/proxy-preferences.ts'
import { PROXY_RISK_REVISION } from '../src/proxy-types.ts'

it('isolates remembered grants by profile and never stores them as an environment reference', async () => {
  const records = new Map<string, CredentialRecord>()
  const credentials = {
    readRecord: async (key: string) => records.get(key),
    modifyRecord: async (key: string, mutate: (value: CredentialRecord | undefined) => Promise<CredentialRecord | undefined>) => {
      const next = await mutate(records.get(key)); if (next) records.set(key, next); return next
    },
    deleteRecord: async (key: string) => { records.delete(key) },
  }
  const a = new Context(), b = new Context()
  for (const [ctx, dir] of [[a, '/fixture/profile-a'], [b, '/fixture/profile-b']] as const) {
    ctx.provide('profileContext', { dir } as Context['profileContext'])
    ctx.provide('credentials', credentials as unknown as Context['credentials'])
  }
  const first = new ProxyPreferenceStore(a), other = new ProxyPreferenceStore(b)
  try {
    const saved = { schema: 1 as const, revision: PROXY_RISK_REVISION, enabled: true,
      configuration: { protocol: 'http' as const, host: 'proxy.example', port: 1, noProxy: '' } }
    await first.write(saved)
    expect(await new ProxyPreferenceStore(a).read()).toEqual(saved)
    expect(await other.read()).toBeUndefined()
    expect([...records.values()][0]?.kind).toBe('grant')
    await first.forget()
    expect(records.size).toBe(0)
  } finally { await a.fiber.dispose(); await b.fiber.dispose() }
})
