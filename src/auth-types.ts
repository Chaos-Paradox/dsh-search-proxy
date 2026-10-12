/** Client-safe contract for optional instance authentication. Values are write-only. */
export interface InstanceAuthTarget {
  baseURL: string
  headerName: string
}

export interface InstanceAuthStatus {
  endpoint: string
  configured: boolean
  writable: boolean
}

export interface InstanceAuthHeader {
  name: string
  value: string
}

export const DEFAULT_AUTH_HEADER = 'X-API-Key'

const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]{1,128}$/
const RESERVED_HEADERS = new Set([
  'accept', 'user-agent', 'host', 'connection', 'content-length', 'transfer-encoding',
  'proxy-authorization', 'proxy-connection', 'upgrade', 'te', 'trailer', 'expect', 'accept-encoding',
])

/** Authentication must not override request routing, framing, or the JSON contract. */
export function validAuthHeaderName(name: string): boolean {
  return HEADER_NAME.test(name) && !RESERVED_HEADERS.has(name.toLowerCase())
}

/** Fetch accepts Latin-1 header values; reject control characters without echoing a secret. */
export function validAuthHeaderValue(value: string): boolean {
  return value.length > 0 && value.length <= 8192 && /^[\t\x20-\x7e\x80-\xff]+$/.test(value)
}

export function parseInstanceAuthStatus(value: unknown): InstanceAuthStatus {
  if (typeof value !== 'object' || value === null
    || typeof Reflect.get(value, 'endpoint') !== 'string'
    || typeof Reflect.get(value, 'configured') !== 'boolean'
    || typeof Reflect.get(value, 'writable') !== 'boolean') throw new Error('Invalid instance authentication response')
  // Project only the public facts, even if a server accidentally adds fields.
  return { endpoint: Reflect.get(value, 'endpoint'), configured: Reflect.get(value, 'configured'), writable: Reflect.get(value, 'writable') }
}
