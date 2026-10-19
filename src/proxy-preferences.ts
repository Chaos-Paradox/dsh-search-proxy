/** Profile-bound proxy consent and configuration, stored through the public credential seam. */
import { createHash } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import { credentialKey } from '@deepseek-ai/dsh-credentials'
import type { ProxyConfiguration } from './proxy-types.ts'

export interface SavedProxy {
  schema: 1
  revision: string
  enabled: boolean
  configuration: ProxyConfiguration
}

export interface ProxyPreferences {
  available(): boolean
  read(): Promise<unknown>
  write(value: SavedProxy): Promise<void>
  forget(): Promise<void>
}

export class ProxyPreferenceStore implements ProxyPreferences {
  constructor(private readonly ctx: Context) {}

  private target() {
    const profile = this.ctx.get('profileContext'), credentials = this.ctx.get('credentials')
    if (!profile || !credentials) return undefined
    const id = createHash('sha256').update(profile.dir).digest('hex')
    return { credentials, key: credentialKey('web-search-searxng', `process-proxy-${id}`) }
  }
  available(): boolean { return !!this.target() }
  async read(): Promise<unknown> {
    const target = this.target()
    if (!target) return undefined
    const record = await target.credentials.readRecord(target.key)
    return record?.kind === 'grant' ? record.payload : undefined
  }
  async write(value: SavedProxy): Promise<void> {
    const target = this.target()
    if (!target) throw new Error('Remembering proxy configuration requires a profile and the DSH credential service')
    await target.credentials.modifyRecord(target.key, async () => ({ kind: 'grant', payload: value }))
  }
  async forget(): Promise<void> {
    const target = this.target()
    if (!target) throw new Error('Removing remembered proxy configuration requires the DSH credential service')
    await target.credentials.deleteRecord(target.key)
  }
}
