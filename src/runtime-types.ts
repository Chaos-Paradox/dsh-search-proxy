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

export interface RuntimeLogStorage {
  bytes: number
  maxBytes: number
  failed: boolean
}

/** First-use disclosure and the exact directory owned by this plugin. */
export interface RuntimeSetupInfo {
  directory: string
  cached: boolean
  components: { name: string; version: string; source: string; verification: 'sha256' | 'tool-managed' | 'package-index' }[]
}

/** One real query, without credential values or arbitrary exception text. */
export interface SearchTestReport {
  /** Managed instance that received the query, even if it stopped before completion. */
  instanceId?: string
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
  /** Configured routes read through the public settings service; absent when unavailable. */
  routing?: RoutingStatus
  routeRestore?: RouteRestoreStatus
  /** Random per-launch identity; no host, port or credential data. */
  instanceId?: string
  phase: ServicePhase
  endpoint: string
  message: string
  logs: string
  /** Coarse setup-failure class for actionable card guidance; raw redacted text stays in message/logs. */
  setupFailure?: 'network'
  setup?: RuntimeSetupInfo
  activities?: RuntimeActivity[]
  logStorage?: RuntimeLogStorage
  testReport?: SearchTestReport
}

export type RouteSource = 'configuration' | 'environment' | 'automatic' | 'unavailable'
/** Selection intent, not provider availability or an account billing receipt. */
export interface RoutingStatus {
  searchProvider: string | null
  fetchProvider: string | null
  searchSource?: RouteSource
  fetchSource?: RouteSource
  /** Saved permissions read from the same live fields used by request dispatch. */
  fallback?: { searchApi: boolean; fetchApi: boolean; legacySearch: boolean }
}

export interface RouteRestoreStatus {
  capability: 'available' | 'read-only' | 'unavailable'
  /** Opaque selection and saved-permission revision; never a credential. */
  revision: string
}
export interface RouteRestoreResult {
  outcome: 'restored' | 'changed' | 'blocked' | 'read-only' | 'unavailable' | 'failed'
  routing: RoutingStatus
}

export function parseRouteRestoreResult(value: unknown): RouteRestoreResult {
  if (!value || typeof value !== 'object' || !['restored', 'changed', 'blocked', 'read-only', 'unavailable', 'failed'].includes(Reflect.get(value, 'outcome'))) throw new Error('Invalid route restoration result')
  const routing = Reflect.get(value, 'routing') as unknown
  if (!routing) throw new Error('Invalid route restoration snapshot')
  parseServiceStatus({ phase: 'idle', endpoint: '', message: '', logs: '', routing })
  return value as RouteRestoreResult
}

export type ServiceMethod = 'status' | 'prepare' | 'restart' | 'stop' | 'cleanup' | 'test' | 'testReport' | 'precheck' | 'clearLogs'
export type ServiceResponse = ServiceStatus | SearchTestReport | PrecheckReport | number

/** One fixed download-endpoint probe; any HTTP answer below 500 counts as reachable. */
export interface PrecheckTarget {
  name: string
  url: string
  ok: boolean
  detail: string
  elapsedMs: number
}

/** Reachability snapshot of the first-use download endpoints, taken from the DSH backend. */
export interface PrecheckReport {
  time: string
  targets: PrecheckTarget[]
}

/** Validate the precheck snapshot received over the authenticated Connection carrier. */
export function parsePrecheckReport(value: unknown): PrecheckReport {
  if (typeof value !== 'object' || value === null || typeof Reflect.get(value, 'time') !== 'string') throw new Error('Invalid download precheck response')
  const targets = Reflect.get(value, 'targets')
  if (!Array.isArray(targets) || targets.length < 1 || targets.length > 8) throw new Error('Invalid download precheck response')
  for (const target of targets as unknown[]) {
    if (typeof target !== 'object' || target === null) throw new Error('Invalid download precheck target')
    const name = Reflect.get(target, 'name'), url = Reflect.get(target, 'url'), detail = Reflect.get(target, 'detail')
    if (typeof name !== 'string' || !name || name.length > 100 || typeof url !== 'string' || !url.startsWith('https://') || url.length > 300
      || typeof Reflect.get(target, 'ok') !== 'boolean' || typeof detail !== 'string' || detail.length > 200
      || !Number.isInteger(Reflect.get(target, 'elapsedMs')) || Reflect.get(target, 'elapsedMs') < 0) throw new Error('Invalid download precheck target')
  }
  return value as PrecheckReport
}

/** Validate the diagnostic response without admitting executable source links. */
export function parseSearchTestReport(value: unknown): SearchTestReport {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid search test response')
  const report = value as SearchTestReport
  validateInstanceId(report.instanceId)
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
  if (status.routeRestore !== undefined && (!status.routeRestore || typeof status.routeRestore !== 'object'
    || !['available', 'read-only', 'unavailable'].includes(status.routeRestore.capability)
    || typeof status.routeRestore.revision !== 'string' || !/^[a-f0-9]{64}$/.test(status.routeRestore.revision))) throw new Error('Invalid route restoration capability')
  if (status.routing !== undefined) {
    if (!status.routing || typeof status.routing !== 'object') throw new Error('Invalid routing status')
    for (const provider of [status.routing.searchProvider, status.routing.fetchProvider]) {
      if (provider !== null && (typeof provider !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(provider))) throw new Error('Invalid routing provider')
    }
    for (const source of [status.routing.searchSource, status.routing.fetchSource]) {
      if (source !== undefined && !['configuration', 'environment', 'automatic', 'unavailable'].includes(source)) throw new Error('Invalid routing source')
    }
    if (status.routing.fallback !== undefined && (!status.routing.fallback || typeof status.routing.fallback !== 'object'
      || ['searchApi', 'fetchApi', 'legacySearch'].some(key => typeof Reflect.get(status.routing!.fallback!, key) !== 'boolean'))) throw new Error('Invalid routing permissions')
  }
  validateInstanceId(status.instanceId)
  if (status.setupFailure !== undefined && status.setupFailure !== 'network') throw new Error('Invalid setup failure class')
  if (status.logStorage !== undefined) {
    const storage = status.logStorage
    if (!storage || typeof storage !== 'object' || typeof storage.failed !== 'boolean'
      || !Number.isInteger(storage.bytes) || !Number.isInteger(storage.maxBytes)
      || storage.bytes < 0 || storage.maxBytes < 1 || storage.bytes > storage.maxBytes) throw new Error('Invalid runtime log storage')
  }
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

function validateInstanceId(value: unknown): void {
  if (value !== undefined && (typeof value !== 'string' || !/^[a-f0-9]{32}$/.test(value))) throw new Error('Invalid managed instance identity')
}
