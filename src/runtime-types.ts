/** JSON values shared by the Host manager and browser card. */
export type ServiceMode = 'auto' | 'local' | 'external'
export type ServicePhase = 'idle' | 'needs-setup' | 'preparing' | 'starting' | 'ready' | 'stopped' | 'failed' | 'external'

/** Operator-only activity; paths and secrets are removed before recording. */
export interface RuntimeActivity {
  time: string
  kind: 'download' | 'verify' | 'extract' | 'command' | 'cache' | 'configure' | 'ready' | 'stop' | 'cleanup' | 'test' | 'error'
  subject: string
  detail: string
}

/** First-use disclosure and the exact directory owned by this plugin. */
export interface RuntimeSetupInfo {
  directory: string
  cached: boolean
  components: { name: string; version: string; source: string; verification: 'sha256' | 'tool-managed' | 'package-index' }[]
}

/** One real query, without credential values or arbitrary exception text. */
export interface SearchTestReport {
  time: string
  query: string
  endpoint: string
  engines: string
  language: string
  authUsed: boolean
  officialFallbackUsed: false
  outcome: 'success' | 'empty' | 'failed'
  failureStage: 'configuration' | 'authentication' | 'connection' | 'http' | 'response' | 'cancelled' | null
  httpStatus: number | null
  responseFormat: 'json' | 'invalid' | 'unavailable'
  elapsedMs: number
  sourceCount: number
  sources: { url: string; title?: string }[]
  message: string
}

/** A bounded service snapshot; no model or API credentials are included. */
export interface ServiceStatus {
  phase: ServicePhase
  endpoint: string
  message: string
  logs: string
  setup?: RuntimeSetupInfo
  activities?: RuntimeActivity[]
  testReport?: SearchTestReport
}

export type ServiceMethod = 'status' | 'prepare' | 'restart' | 'stop' | 'cleanup' | 'test' | 'testReport'
export type ServiceResponse = ServiceStatus | SearchTestReport | number

/** Validate the diagnostic response without admitting executable source links. */
export function parseSearchTestReport(value: unknown): SearchTestReport {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid search test response')
  const report = value as SearchTestReport
  for (const key of ['time', 'query', 'endpoint', 'engines', 'language', 'message'] as const) {
    if (typeof report[key] !== 'string' || report[key].length > 4000) throw new Error('Invalid search test text')
  }
  if (!['success', 'empty', 'failed'].includes(report.outcome)
    || ![null, 'configuration', 'authentication', 'connection', 'http', 'response', 'cancelled'].includes(report.failureStage)
    || !['json', 'invalid', 'unavailable'].includes(report.responseFormat)
    || typeof report.authUsed !== 'boolean' || report.officialFallbackUsed !== false
    || !Number.isInteger(report.elapsedMs) || report.elapsedMs < 0
    || !Number.isInteger(report.sourceCount) || report.sourceCount < 0
    || report.httpStatus !== null && (!Number.isInteger(report.httpStatus) || report.httpStatus < 100 || report.httpStatus > 599)
    || !Array.isArray(report.sources) || report.sources.length > 3) throw new Error('Invalid search test response')
  for (const source of report.sources) {
    if (typeof source !== 'object' || source === null || typeof source.url !== 'string'
      || !URL.canParse(source.url) || !['http:', 'https:'].includes(new URL(source.url).protocol) || new URL(source.url).username || new URL(source.url).password
      || source.title !== undefined && typeof source.title !== 'string') throw new Error('Invalid search test source')
  }
  return report
}

/** Validate a response received over the authenticated Connection carrier. */
export function parseServiceStatus(value: unknown): ServiceStatus {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid service response')
  const phase = Reflect.get(value, 'phase')
  if (!['idle', 'needs-setup', 'preparing', 'starting', 'ready', 'stopped', 'failed', 'external'].includes(phase)) throw new Error('Invalid service phase')
  for (const key of ['endpoint', 'message', 'logs']) if (typeof Reflect.get(value, key) !== 'string') throw new Error(`Invalid service ${key}`)
  const status = value as ServiceStatus
  if (status.setup !== undefined) {
    if (typeof status.setup !== 'object' || status.setup === null || typeof status.setup.directory !== 'string'
      || typeof status.setup.cached !== 'boolean' || !Array.isArray(status.setup.components) || status.setup.components.length > 8) throw new Error('Invalid runtime disclosure')
    for (const component of status.setup.components) {
      if (typeof component !== 'object' || component === null
        || ['name', 'version', 'source'].some(key => typeof Reflect.get(component, key) !== 'string')
        || !['sha256', 'tool-managed', 'package-index'].includes(component.verification)) throw new Error('Invalid runtime component')
    }
  }
  if (status.activities !== undefined) {
    if (!Array.isArray(status.activities) || status.activities.length > 100) throw new Error('Invalid runtime activity')
    for (const activity of status.activities) {
      if (typeof activity !== 'object' || activity === null
        || ['time', 'subject', 'detail'].some(key => typeof Reflect.get(activity, key) !== 'string')
        || !['download', 'verify', 'extract', 'command', 'cache', 'configure', 'ready', 'stop', 'cleanup', 'test', 'error'].includes(activity.kind)) throw new Error('Invalid runtime activity')
    }
  }
  if (status.testReport !== undefined) parseSearchTestReport(status.testReport)
  return value as ServiceStatus
}
