/** A process-wide proxy lease with profile-bound remembered consent. */
import { randomBytes } from 'node:crypto'
import type { LaunchEnvironmentSnapshot } from '@deepseek-ai/dsh-launch-environment'
import { PROXY_RISK_REVISION } from './proxy-types.ts'
import type { ProxyApproval, ProxyConfiguration, ProxyStatus } from './proxy-types.ts'
import type { ProxyPreferences, SavedProxy } from './proxy-preferences.ts'

type ProxyApi = Pick<typeof import('@deepseek-ai/dsh-http-proxy'), 'installProxyFromEnvironment' | 'proxyRouteFor'>
type Route = ReturnType<ProxyApi['proxyRouteFor']>
type ProxyDispatcher = Extract<Route, { proxied: true }>['dispatcher']
// Retain the original lease key across the package rename so old and new copies cannot both own it.
const OWNER = Symbol.for('dsh-web-search-searxng.process-proxy-owner')
const owners = globalThis as typeof globalThis & { [OWNER]?: object }
const PROBE = new URL('https://proxy-policy-check.invalid/')
const PROBE_HTTP = new URL('http://proxy-policy-check.invalid/')
const PROXY_NAMES = ['HTTP_PROXY', 'http_proxy', 'HTTPS_PROXY', 'https_proxy', 'ALL_PROXY', 'all_proxy']
const CHANGED_ENV_NAMES = ['HTTP_PROXY', 'http_proxy', 'HTTPS_PROXY', 'https_proxy', 'NO_PROXY', 'no_proxy']

/** Operator-chosen endpoint only; no credentials, paths, default ports or automatic discovery. */
export function proxyConfiguration(value: ProxyConfiguration): { endpoint: string; noProxy: string } {
  if (!value || !['http', 'https'].includes(value.protocol) || typeof value.host !== 'string'
    || !value.host.trim() || /[\s/@?#\\]/.test(value.host) || !Number.isInteger(value.port) || value.port < 1 || value.port > 65535
    || typeof value.noProxy !== 'string' || value.noProxy.length > 4000) throw new Error('Invalid proxy configuration')
  let endpoint: URL
  try { endpoint = new URL(`${value.protocol}://${value.host}:${value.port}`) } catch { throw new Error('Invalid proxy configuration') }
  if (!endpoint.hostname || endpoint.username || endpoint.password || endpoint.pathname !== '/' || endpoint.search || endpoint.hash) throw new Error('Invalid proxy configuration')
  const bypass = value.noProxy.split(/[,\s]+/).filter(Boolean)
  for (const host of bypass) {
    // Exact hosts/suffixes only; do not accidentally expose a bypass-all or unsupported CIDR option.
    if (!/^\.?[a-z0-9][a-z0-9.-]*$/i.test(host) || host.includes('..')) throw new Error('Invalid proxy bypass host')
  }
  return { endpoint: endpoint.origin, noProxy: bypass.join(',') }
}

/** Approval grants are short-lived, rotating and single-use. Controls are never model tools. */
export class ProcessProxy {
  private api: ProxyApi | undefined
  private loaded = false
  private disposed = false
  private tail: Promise<unknown> = Promise.resolve()
  private approval: (ProxyApproval & { expires: number }) | undefined
  private release: (() => Promise<void>) | undefined
  private dispatcher: ProxyDispatcher | undefined
  private readonly identity = {}
  private saved: SavedProxy | undefined
  private restored = false
  private restoreFailed = false

  constructor(private readonly environment: LaunchEnvironmentSnapshot,
    private readonly loadApi: () => Promise<ProxyApi> = () => import('@deepseek-ai/dsh-http-proxy'),
    private readonly preferences?: ProxyPreferences) {}

  private serial<T>(operation: () => Promise<T>, cleanup = false): Promise<T> {
    const task = this.tail.then(() => {
      if (this.disposed && !cleanup) throw new Error('Proxy controls are no longer available')
      return operation()
    })
    this.tail = task.catch(() => {})
    return task
  }
  private async load(): Promise<ProxyApi | undefined> {
    if (!this.loaded) {
      this.loaded = true
      try {
        const api = await this.loadApi()
        if (typeof api.installProxyFromEnvironment === 'function' && typeof api.proxyRouteFor === 'function') this.api = api
      } catch { /* Optional capability: ordinary search remains available. */ }
    }
    return this.api
  }
  private state(): ProxyStatus {
    const state = this.release ? 'active' : !this.api ? 'unavailable' : this.inherited() ? 'inherited' : 'off'
    return { state, riskRevision: PROXY_RISK_REVISION, ...this.preferences ? {
      remembered: this.saved?.revision === PROXY_RISK_REVISION,
      restoreFailed: this.restoreFailed,
    } : {} }
  }
  private inherited(): boolean {
    return PROXY_NAMES.some(name => !!this.environment.get(name)?.value.trim())
      || !!this.api?.proxyRouteFor(PROBE).proxied || !!this.api?.proxyRouteFor(PROBE_HTTP).proxied
      || !!owners[OWNER] && owners[OWNER] !== this.identity
  }
  private grant(step: ProxyApproval['step']): ProxyApproval {
    const approval = { step, token: randomBytes(32).toString('hex'), riskRevision: PROXY_RISK_REVISION }
    this.approval = { ...approval, expires: Date.now() + 300_000 }
    return approval
  }
  private take(token: string, step: ProxyApproval['step']): void {
    const grant = this.approval
    this.approval = undefined
    if (!grant || grant.step !== step || grant.token !== token || grant.expires < Date.now()) throw new Error('Proxy approval expired; review and acknowledge the risks again')
  }
  status(): Promise<ProxyStatus> { return this.serial(async () => { await this.load(); return this.state() }) }
  /** Startup only: old sessions never create a new grant or silently accept a changed statement. */
  restore(): Promise<void> {
    return this.serial(async () => {
      if (this.restored || !this.preferences?.available()) return
      this.restored = true
      try {
        const value = await this.preferences.read()
        if (!value || typeof value !== 'object' || Reflect.get(value, 'schema') !== 1
          || typeof Reflect.get(value, 'revision') !== 'string' || typeof Reflect.get(value, 'enabled') !== 'boolean') return
        const configuration = Reflect.get(value, 'configuration') as ProxyConfiguration
        proxyConfiguration(configuration)
        this.saved = { schema: 1, revision: Reflect.get(value, 'revision'), enabled: Reflect.get(value, 'enabled'), configuration: { ...configuration } }
        await this.load()
        if (this.saved.enabled && this.saved.revision === PROXY_RISK_REVISION && this.state().state === 'off') await this.install(configuration)
      } catch { this.restoreFailed = true }
    })
  }
  begin(): Promise<ProxyApproval> {
    return this.serial(async () => {
      await this.load()
      if (this.state().state !== 'off') throw new Error('Proxy is active, inherited, or unavailable')
      return this.grant('notice')
    })
  }
  confirm(token: string, step: 'notice' | 'statement', revision: string, accepted: boolean): Promise<ProxyApproval> {
    return this.serial(async () => {
      if (revision !== PROXY_RISK_REVISION || !['notice', 'statement'].includes(step)) throw new Error('Invalid proxy risk confirmation')
      if (step === 'statement' && accepted !== true) throw new Error('Risk acknowledgement required')
      this.take(token, step)
      return this.grant(step === 'notice' ? 'statement' : 'approved')
    })
  }
  apply(token: string, configuration: ProxyConfiguration): Promise<ProxyStatus> {
    return this.serial(async () => {
      this.take(token, 'approved')
      await this.activate(configuration)
      return this.state()
    })
  }
  resume(): Promise<ProxyStatus> {
    return this.serial(async () => {
      if (!this.saved || this.saved.revision !== PROXY_RISK_REVISION) throw new Error('Review and acknowledge the current risk statement before enabling a new proxy')
      await this.activate(this.saved.configuration)
      return this.state()
    })
  }
  private async activate(configuration: ProxyConfiguration): Promise<void> {
    await this.install(configuration)
    try {
      if (this.preferences) {
        const saved: SavedProxy = { schema: 1, revision: PROXY_RISK_REVISION, enabled: true, configuration: { ...configuration } }
        await this.preferences.write(saved)
        this.saved = saved
      }
      this.restoreFailed = false
    } catch {
      await this.clear()
      throw new Error('Could not remember the proxy configuration; no plugin proxy remains active')
    }
  }
  private async install(configuration: ProxyConfiguration): Promise<void> {
      const { endpoint, noProxy } = proxyConfiguration(configuration)
      const api = await this.load()
      if (this.disposed || !api || this.release || this.inherited()) throw new Error('Proxy policy changed; resolve the existing configuration before retrying')
      // Reserve before awaiting installation, including across independently loaded plugin instances.
      owners[OWNER] = this.identity
      const inheritedBypass = this.environment.get('no_proxy')?.value || this.environment.get('NO_PROXY')?.value || ''
      const values: Record<string, string> = { HTTP_PROXY: endpoint, HTTPS_PROXY: endpoint, NO_PROXY: [inheritedBypass, noProxy].filter(Boolean).join(',') }
      const previous = Object.fromEntries(CHANGED_ENV_NAMES.map(name => [name, process.env[name]]))
      try {
        this.release = await api.installProxyFromEnvironment({ get: name => values[name] === undefined ? undefined : { value: values[name] } }, () => {})
        const route = api.proxyRouteFor(PROBE)
        if (route.proxied) this.dispatcher = route.dispatcher
        if (!route.proxied || this.disposed) {
          await this.clear()
          throw new Error('Proxy activation was cancelled')
        }
      } catch {
        // The host publishes environment values before creating its dispatcher. A failed creation
        // returns no disposer, so restore that partial installation without logging any values.
        if (this.release) await this.clear().catch(() => {})
        else for (const name of CHANGED_ENV_NAMES) {
          if (previous[name] === undefined) delete process.env[name]
          else process.env[name] = previous[name]
        }
        if (owners[OWNER] === this.identity) delete owners[OWNER]
        throw new Error('Could not activate the session proxy')
      }
      this.restoreFailed = false
  }
  private async clear(): Promise<void> {
    this.approval = undefined
    const release = this.release, dispatcher = this.dispatcher
    this.release = undefined
    this.dispatcher = undefined
    if (!release) return
    try {
      // Begin destruction before the host starts graceful close: an already-closing pool may wait
      // for an unbounded stream. Restore routing/environment immediately, before awaiting either.
      const destroying = dispatcher?.destroy()
      const closing = release()
      const results = await Promise.allSettled([closing, destroying])
      const closed = results[0], destroyed = results[1]
      // Graceful close of an already destroyed dispatcher reports this expected Undici code;
      // the host has already restored its prior policy and environment before that close call.
      const alreadyDestroyed = closed.status === 'rejected' && typeof closed.reason === 'object' && closed.reason !== null
        && Reflect.get(closed.reason, 'code') === 'UND_ERR_DESTROYED'
      if (destroyed.status === 'rejected' || closed.status === 'rejected' && !alreadyDestroyed) throw new Error('Proxy cleanup failed; restart DSH')
    } finally { if (owners[OWNER] === this.identity) delete owners[OWNER] }
  }
  /** Turning off is durable; disposing the plugin only releases this process's lease. */
  remove(): Promise<ProxyStatus> {
    return this.serial(async () => {
      try {
        if (this.preferences && this.saved) {
          const saved = { ...this.saved, enabled: false }
          await this.preferences.write(saved)
          this.saved = saved
        }
      } finally { await this.clear() }
      return this.state()
    })
  }
  forget(): Promise<ProxyStatus> {
    return this.serial(async () => {
      try {
        await this.preferences?.forget()
        this.saved = undefined
        this.restoreFailed = false
      } finally { await this.clear() }
      return this.state()
    })
  }
  dispose(): Promise<void> { this.disposed = true; return this.serial(() => this.clear(), true) }
}
