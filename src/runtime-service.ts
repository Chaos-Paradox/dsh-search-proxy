/** Authenticated card controls and profile-scoped managed service selection. */
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-app-boot'
import type {} from '@deepseek-ai/dsh-subprocess'
import type { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { ManagedRuntime } from './managed-runtime.ts'
import type { ManagedOptions } from './managed-runtime.ts'
import type { RouteRestoreResult, RoutingStatus, RuntimeActivity, SearchTestReport, ServiceMode, ServiceStatus } from './runtime-types.ts'
import { readRoutingStatus } from './routing-status.ts'
import { restorePluginRoutes, routeRestoreStatus } from './route-restoration.ts'
import type { SearxngSearchProvider } from './provider.ts'
import type { SearxngSearchProviderOptions } from './provider.ts'
import { InstanceAuthStore } from './instance-auth.ts'
import type { InstanceAuthHeader, InstanceAuthStatus, InstanceAuthTarget } from './auth-types.ts'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'
import { ProcessProxy } from './process-proxy.ts'
import { ProxyPreferenceStore } from './proxy-preferences.ts'
import type { ProxyApproval, ProxyConfiguration, ProxyStatus } from './proxy-types.ts'

export interface ServiceOptions extends ManagedOptions { mode: ServiceMode; externalURL: string; fallback?: RoutingStatus['fallback'] }

declare module '@deepseek-ai/cordis' {
  interface Context { searxngRuntime: SearxngRuntimeService }
}

/** Controls are operator RPCs, never model tools. External services are never stopped. */
export class SearxngRuntimeService extends TypertRemoteService {
  private manager: ManagedRuntime | undefined
  private key = ''
  private local = false
  private error = ''
  private disposed = false
  private subprocess: SubprocessRuntime | undefined
  private readonly auth: InstanceAuthStore
  private report: SearchTestReport | undefined
  private readonly tests: RuntimeActivity[] = []
  private readonly proxy: ProcessProxy
  private readonly routeEnvironment = { searchProvider: process.env.DSH_WEB_SEARCH_PROVIDER, fetchProvider: process.env.DSH_WEB_FETCH_PROVIDER }

  constructor(ctx: Context, private readonly options: () => ServiceOptions, private readonly provider: SearxngSearchProvider) {
    super(ctx, 'searxngRuntime')
    this.proxy = new ProcessProxy(launchEnvironmentOf(ctx), undefined, new ProxyPreferenceStore(ctx))
    ctx.effect(() => () => this.proxy.dispose(), 'SearXNG session proxy restoration')
    ctx.inject(['credentials'], () => { void this.proxy.restore().catch(() => {}) })
    this.auth = new InstanceAuthStore(ctx, () => this.options().externalURL)
    ctx.effect(() => async () => { this.disposed = true; await this.manager?.dispose() }, 'SearXNG owned process')
    // Bundle rows mount concurrently. Wait for the public service to become
    // active, and dispose its consumer before a replacement process service.
    ctx.inject(['subprocess'], ctx => {
      this.subprocess = ctx.subprocess
      this.key = ''
      this.sync()
      ctx.effect(() => async () => {
        const manager = this.manager
        this.manager = undefined
        this.subprocess = undefined
        this.key = ''
        await manager?.dispose('subprocess-service-disposed')
      }, 'SearXNG subprocess dependency')
    })
  }

  /** Reconcile only service settings; engine/language writes do not restart the process. */
  sync(force = false): void {
    if (this.disposed) return
    const options = this.options()
    const local = options.mode === 'local' || options.mode === 'auto' && !options.externalURL.trim()
    const key = JSON.stringify({ local, port: options.port, setupTimeoutMs: options.setupTimeoutMs,
      startupTimeoutMs: options.startupTimeoutMs, restartLimit: options.restartLimit })
    if (!force && key === this.key) return
    this.key = key
    this.local = local
    this.error = ''
    if (!local) { void this.manager?.stop('external-mode'); return }
    if (!this.manager) {
      const profile = this.ctx.get('profileContext')
      if (!profile) {
        this.error = 'Local management requires a DSH profile; configure an external instance instead'
        return
      }
      if (!this.subprocess) return
      this.manager = new ManagedRuntime(join(profile.dir, 'searxng'), this.subprocess)
    }
    const manager = this.manager
    void this.proxy.restore().then(() => {
      if (!this.disposed && this.manager === manager && this.key === key) return manager.start(options, false, force ? 'operator-restart' : 'configuration-change')
    }).catch(() => {})
  }

  /** Only a ready owned service may supply a managed endpoint. */
  endpoint(): string {
    if (!this.local) return this.options().externalURL
    const status = this.manager?.status()
    return status?.phase === 'ready' ? status.endpoint : ''
  }

  /** Backend-only resolution; owned local processes never receive external credentials. */
  async resolveAuth(options: SearxngSearchProviderOptions): Promise<InstanceAuthHeader> {
    if (this.local) throw new Error('Managed local SearXNG does not use instance authentication')
    return this.auth.resolve({ baseURL: options.baseURL, headerName: options.authHeaderName ?? '' })
  }

  @Remote
  async authDescribe(target: InstanceAuthTarget): Promise<InstanceAuthStatus> {
    try { return await this.auth.describe(target) }
    catch { throw new Error('Could not read instance authentication status; check the endpoint, header name and credential service') }
  }

  @Remote
  async authSet(target: InstanceAuthTarget, value: string): Promise<InstanceAuthStatus> {
    try { return await this.auth.set(target, value) }
    catch { throw new Error('Could not save the instance credential; check the endpoint, header name, single-line value and credential service') }
  }

  @Remote
  async authClear(target: InstanceAuthTarget): Promise<InstanceAuthStatus> {
    try { return await this.auth.clear(target) }
    catch { throw new Error('Could not remove the instance credential') }
  }

  @Remote
  proxyStatus(): Promise<ProxyStatus> { return this.proxy.status() }

  @Remote
  proxyBegin(): Promise<ProxyApproval> { return this.proxy.begin() }

  @Remote
  proxyConfirm(token: string, step: 'notice' | 'statement', revision: string, accepted: boolean): Promise<ProxyApproval> {
    return this.proxy.confirm(token, step, revision, accepted)
  }

  @Remote
  proxyApply(token: string, configuration: ProxyConfiguration): Promise<ProxyStatus> { return this.proxy.apply(token, configuration) }

  @Remote
  proxyRemove(): Promise<ProxyStatus> { return this.proxy.remove() }

  @Remote
  proxyResume(): Promise<ProxyStatus> { return this.proxy.resume() }

  @Remote
  proxyForget(): Promise<ProxyStatus> { return this.proxy.forget() }

  /** Return setup, readiness and bounded diagnostic output to the operator card. */
  @Remote
  status(): ServiceStatus {
    const routing = this.routing()
    const routes = { routing, routeRestore: routeRestoreStatus(this.ctx, routing) }
    if (!this.local) return { phase: 'external', endpoint: this.options().externalURL, message: '', logs: '', activities: [...this.tests], ...routes, ...this.report ? { testReport: this.report } : {} }
    if (this.error) return { phase: 'failed', endpoint: '', message: this.error, logs: '', ...routes }
    const status = this.manager?.status() ?? { phase: 'idle' as const, endpoint: '', message: 'Waiting for the DSH subprocess service', logs: '' }
    return { ...status, ...routes, activities: [...status.activities ?? [], ...this.tests].sort((a, b) => a.time.localeCompare(b.time)).slice(-100), ...this.report ? { testReport: this.report } : {} }
  }

  private routing(): RoutingStatus {
    return readRoutingStatus(this.ctx, this.routeEnvironment, this.options().fallback)
  }

  @Remote
  restoreRoutes(expectedRevision: string): Promise<RouteRestoreResult> {
    return restorePluginRoutes(this.ctx, expectedRevision, () => {
      // alpha.2 may normally remount this plugin when its non-volatile Web
      // config changes. Read the replacement service after reconciliation.
      const live = this.ctx.root.get('searxngRuntime')
      return live && live !== this ? live.status().routing ?? this.routing() : this.routing()
    })
  }

  /** Operator approval applies to this version's initial preparation during this run. */
  @Remote
  prepare(): ServiceStatus {
    if (!this.local || !this.manager) throw new Error('Local preparation is unavailable; save local mode and wait for the process service')
    void this.manager.start(this.options(), true, 'operator-prepare')
    return this.status()
  }

  /** Retry failed setup or restart this plugin's local service, preserving configuration. */
  @Remote
  restart(): ServiceStatus {
    this.sync(true)
    return this.status()
  }

  /** Stop this plugin's local process; external instances are unaffected. */
  @Remote
  async stop(): Promise<ServiceStatus> {
    if (this.local) await this.manager?.stop('operator-stop')
    return this.status()
  }

  /** Remove generated local runtime files; normal settings and credential records are separate. */
  @Remote
  async cleanup(): Promise<ServiceStatus> {
    if (!this.local || !this.manager) throw new Error('Only the managed local runtime can be cleaned')
    await this.manager.cleanup()
    return this.status()
  }

  /** Structured result of one direct SearXNG search, never the paid fallback. */
  @Remote
  async testReport(signal: AbortSignal): Promise<SearchTestReport> {
    const instanceId = this.status().instanceId
    const report: SearchTestReport = { ...await this.provider.testReport(signal), ...instanceId ? { instanceId } : {} }
    this.report = report
    this.tests.push({ time: report.time, kind: 'test', subject: report.query,
      detail: `HTTP ${report.httpStatus ?? '-'} / ${report.responseFormat} / ${report.sourceCount} / ${report.elapsedMs} ms${report.message ? ` / ${report.message}` : ''}` })
    if (this.tests.length > 100) this.tests.shift()
    return report
  }

  /** Test the selected SearXNG endpoint without invoking official fallback. */
  @Remote
  async test(signal: AbortSignal): Promise<number> {
    const result = await this.provider.search({ query: 'SearXNG', maxResults: 3 }, signal)
    return result.sources.length
  }
}
