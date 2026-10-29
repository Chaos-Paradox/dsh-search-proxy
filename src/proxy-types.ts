/** Client-safe proxy contract. Only operator settings reads expose saved configuration. */
export const PROXY_RISK_REVISION = '2026-10-19-v3'
export const PROXY_RISK_URL = 'https://github.com/Chaos-Paradox/dsh-search-proxy/blob/main/docs/proxy-risk.zh.md'
export const PROXY_RISK_URL_EN = 'https://github.com/Chaos-Paradox/dsh-search-proxy/blob/main/docs/proxy-risk.md'

export interface ProxyConfiguration {
  protocol: 'http' | 'https'
  host: string
  port: number
  noProxy: string
}
export interface ProxyStatus {
  state: 'off' | 'active' | 'inherited' | 'unavailable'
  riskRevision: string
  remembered?: boolean
  restoreFailed?: boolean
  /** Only proxyDescribe returns configuration; status and diagnostic responses omit it. */
  configuration?: ProxyConfiguration
}
export interface ProxyApproval {
  step: 'notice' | 'statement' | 'approved'
  token: string
  riskRevision: string
}
export type ProxyMethod = 'proxyStatus' | 'proxyDescribe' | 'proxyBegin' | 'proxyConfirm' | 'proxyApply' | 'proxyRemove' | 'proxyResume' | 'proxyForget'
export type ProxyResponse = ProxyStatus | ProxyApproval
export type ProxyCall = (method: ProxyMethod, args: Record<string, unknown>) => Promise<ProxyResponse>

export function parseProxyResponse(value: unknown): ProxyResponse {
  if (!value || typeof value !== 'object' || Reflect.get(value, 'riskRevision') !== PROXY_RISK_REVISION) throw new Error('Invalid proxy response')
  const state = Reflect.get(value, 'state')
  if (['off', 'active', 'inherited', 'unavailable'].includes(state)) {
    const remembered = Reflect.get(value, 'remembered'), restoreFailed = Reflect.get(value, 'restoreFailed')
    if (remembered !== undefined && typeof remembered !== 'boolean' || restoreFailed !== undefined && typeof restoreFailed !== 'boolean') throw new Error('Invalid proxy status')
    const configuration = Reflect.get(value, 'configuration')
    let parsed: ProxyConfiguration | undefined
    if (configuration !== undefined) {
      if (!configuration || typeof configuration !== 'object') throw new Error('Invalid proxy configuration')
      const protocol = Reflect.get(configuration, 'protocol'), host = Reflect.get(configuration, 'host')
      const port = Reflect.get(configuration, 'port'), noProxy = Reflect.get(configuration, 'noProxy')
      if (!['http', 'https'].includes(protocol) || typeof host !== 'string' || !host || typeof port !== 'number'
        || !Number.isInteger(port) || port < 1 || port > 65535 || typeof noProxy !== 'string') throw new Error('Invalid proxy configuration')
      parsed = { protocol, host, port, noProxy }
    }
    return { state, riskRevision: PROXY_RISK_REVISION, ...remembered !== undefined ? { remembered } : {},
      ...restoreFailed !== undefined ? { restoreFailed } : {}, ...parsed ? { configuration: parsed } : {} }
  }
  const step = Reflect.get(value, 'step'), token = Reflect.get(value, 'token')
  if (!['notice', 'statement', 'approved'].includes(step) || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid proxy approval')
  return { step, token, riskRevision: PROXY_RISK_REVISION }
}
