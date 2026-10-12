/** Optional endpoint-bound credentials using DSH's public credential store. */
import { createHash } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import { credentialKey } from '@deepseek-ai/dsh-credentials'
import { DEFAULT_AUTH_HEADER, validAuthHeaderName, validAuthHeaderValue } from './auth-types.ts'
import type { InstanceAuthHeader, InstanceAuthStatus, InstanceAuthTarget } from './auth-types.ts'

function normalize(target: InstanceAuthTarget, fallbackURL = ''): { endpoint: string; headerName: string } {
  const headerName = target.headerName.trim() || DEFAULT_AUTH_HEADER
  if (!validAuthHeaderName(headerName)) throw new Error('Invalid authentication header name; use an authentication header such as X-API-Key or Authorization')
  const source = target.baseURL.trim() || fallbackURL.trim()
  if (!source) return { endpoint: '', headerName }
  let url: URL
  try { url = new URL(source) } catch { throw new Error('Authentication requires a valid HTTP or HTTPS instance endpoint') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Authentication requires an HTTP or HTTPS endpoint without URL credentials')
  }
  // Bind to the exact mount used by the provider's relative /search request.
  // Preserve repeated slashes: a reverse proxy may route those differently.
  url = new URL('search', source.endsWith('/') ? source : `${source}/`)
  url.search = ''; url.hash = ''
  url.pathname = url.pathname.slice(0, -'search'.length)
  return { endpoint: url.href, headerName }
}

function keyFor(endpoint: string, headerName: string) {
  const digest = createHash('sha256').update(`${endpoint}\n${headerName.toLowerCase()}`).digest('hex')
  return credentialKey('web-search-searxng', `instance-${digest}`)
}

export class InstanceAuthStore {
  constructor(private readonly ctx: Context, private readonly fallbackURL: () => string) {}

  async describe(target: InstanceAuthTarget): Promise<InstanceAuthStatus> {
    const { endpoint, headerName } = normalize(target, this.fallbackURL())
    const credentials = this.ctx.get('credentials')
    if (!credentials || !endpoint) return { endpoint, configured: false, writable: false }
    const info = await credentials.describeRecord(keyFor(endpoint, headerName))
    return { endpoint, configured: info.configured, writable: info.writable }
  }

  async set(target: InstanceAuthTarget, value: string): Promise<InstanceAuthStatus> {
    if (!validAuthHeaderValue(value)) throw new Error('Invalid authentication header value; use a single-line value of at most 8192 bytes')
    const { endpoint, headerName } = normalize(target, this.fallbackURL())
    const credentials = this.ctx.get('credentials')
    if (!credentials || !endpoint) throw new Error('Saving authentication requires an instance endpoint and the DSH credential service')
    await credentials.modifyRecord(keyFor(endpoint, headerName), async () => ({ kind: 'api-key', key: value }))
    return this.describe(target)
  }

  async clear(target: InstanceAuthTarget): Promise<InstanceAuthStatus> {
    const { endpoint, headerName } = normalize(target, this.fallbackURL())
    const credentials = this.ctx.get('credentials')
    if (!credentials || !endpoint) throw new Error('Removing authentication requires an instance endpoint and the DSH credential service')
    await credentials.deleteRecord(keyFor(endpoint, headerName))
    return this.describe(target)
  }

  /** Called only on the backend; this method is never exposed through RPC. */
  async resolve(target: InstanceAuthTarget): Promise<InstanceAuthHeader> {
    const { endpoint, headerName } = normalize(target)
    const credentials = this.ctx.get('credentials')
    if (!credentials) throw new Error('Instance authentication requires the DSH credential service; disable authentication to use a credential-free instance')
    const record = await credentials.readRecord(keyFor(endpoint, headerName))
    if (record?.kind !== 'api-key' || !record.key) {
      throw new Error('No authentication value is saved for this instance endpoint and header name; save a value on the plugin card or disable authentication')
    }
    if (!validAuthHeaderValue(record.key)) throw new Error('The saved authentication value is invalid; replace it on the plugin card')
    return { name: headerName, value: record.key }
  }
}
