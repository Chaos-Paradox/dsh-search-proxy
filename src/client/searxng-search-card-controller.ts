/**
 * The SearXNG search page's staged form over the `web-search-searxng` settings
 * namespace. Optional credentials are write-only and stored separately by the Host;
 * one save covers settings and a staged credential.
 */

import type {
  SettingsFieldSpec, SettingsFieldState, SettingsFormActions, SettingsFormShell, SettingsFormScope,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { SettingsFormModel, settingsTextField } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { ServiceMode, ServiceStatus } from '../runtime-types.ts'
import { DEFAULT_AUTH_HEADER, validAuthHeaderName } from '../auth-types.ts'
import type { InstanceAuthStatus, InstanceAuthTarget } from '../auth-types.ts'

export interface InstanceAuthClient {
  describe(target: InstanceAuthTarget): Promise<InstanceAuthStatus>
  set(target: InstanceAuthTarget, value: string): Promise<InstanceAuthStatus>
  clear(target: InstanceAuthTarget): Promise<InstanceAuthStatus>
}

/**
 * Namespace of the SearXNG search provider. Spelled here rather than
 * imported: a client package must not depend on a Host package.
 */
export const SEARXNG_SEARCH_NS = 'web-search-searxng'

/**
 * The official-fallback switch, staged as hidden text but stored as a
 * boolean. Both positions write an explicit value so an inherited `true`
 * cannot prevent the user from disabling paid fallback.
 * @param field - field name inside the namespace section.
 * @returns the field's conversion spec.
 */
function settingsSwitchField(field: string): SettingsFieldSpec {
  return {
    field,
    format: value => value === true ? 'true' : 'false',
    parse: text => ({ kind: 'set', value: text === 'true' }),
  }
}

/** The search-provider fields this page edits. */
export interface SearxngSearchSettings {
  mode?: ServiceMode
  managedPort?: number
  /** Instance endpoint; blank inherits `$SEARXNG_BASE_URL`. */
  baseURL?: string
  /** Comma-separated engine restriction; blank uses the instance default. */
  engines?: string
  /** Preferred result language; blank uses the instance default. */
  language?: string
  authEnabled?: boolean
  authHeaderName?: string
  /**
   * Per-request official fallback: `true` permits one official attempt only
   * when the host exposes public `web.searchWithProvider` dispatch. Unpatched
   * DSH 0.2.1-alpha.2 reports the capability limit after a primary failure.
   * A served fallback carries a cost notice in the result.
   * Absent keeps the strict default: failures fail loudly, zero official
   * requests. The page renders this as a switch, never a text input.
   */
  allowOfficialFallback?: boolean
}

/** What the SearXNG search page renders. */
export interface SearxngSearchCardState extends SettingsFormShell {
  mode: SettingsFieldState
  managedPort: SettingsFieldState
  /** Instance endpoint. */
  baseURL: SettingsFieldState
  /** Engine restriction. */
  engines: SettingsFieldState
  /** Result language. */
  language: SettingsFieldState
  authEnabled: SettingsFieldState
  authHeaderName: SettingsFieldState
  /** A draft only; saved values never return from the Host. */
  authHeaderValue: SettingsFieldState
  authConfigured: boolean
  authWritable: boolean
  authEndpoint: string
  authBusy: boolean
  authFailed: boolean
  /** Official-fallback switch state ('true' when allowed); never rendered as an input. */
  allowOfficialFallback: SettingsFieldState
}

/** The registration-side face the SearXNG search page's slot entry injects. */
export interface SearxngSearchCardFace extends SettingsFormActions {
  clearAuth: () => void
  serviceCall?: (method: 'status' | 'restart' | 'stop' | 'test', signal: AbortSignal) => Promise<ServiceStatus | number>
  hooks: {
    /** Page snapshot bound by the renderer as useSearxngSearchCard. */
    searxngSearchCard: SnapshotStore<SearxngSearchCardState>
  }
}

/** Bridges the `web-search-searxng` scope onto the page. */
export class SearxngSearchCardController {
  private readonly form: SettingsFormModel<SearxngSearchSettings>
  private readonly store: SnapshotStore<SearxngSearchCardState>
  private readonly unsubscribe: () => void
  private authStatus: InstanceAuthStatus = { endpoint: '', configured: false, writable: false }
  private authBusy = false
  private authFailed = false
  private revision = 0
  private disposed = false

  /**
   * @param scope - the bound settings scope for the `web-search-searxng` namespace.
   */
  constructor(private readonly scope: SettingsFormScope<SearxngSearchSettings>, private readonly auth?: InstanceAuthClient) {
    this.form = new SettingsFormModel(
      scope,
      [
        { field: 'mode', format: value => typeof value === 'string' ? value : 'auto',
          parse: text => ['auto', 'local', 'external'].includes(text) ? { kind: 'set', value: text } : undefined },
        { field: 'managedPort', format: value => typeof value === 'number' ? String(value) : '0',
          parse: text => /^\d+$/.test(text) && Number(text) <= 65535 ? { kind: 'set', value: Number(text) } : undefined },
        settingsTextField('baseURL'),
        settingsTextField('engines'),
        settingsTextField('language'),
        settingsSwitchField('authEnabled'),
        { field: 'authHeaderName', format: value => typeof value === 'string' && value.trim() ? value : DEFAULT_AUTH_HEADER,
          parse: text => !text.trim() ? { kind: 'clear' } : validAuthHeaderName(text.trim()) ? { kind: 'set', value: text.trim() } : undefined },
        settingsSwitchField('allowOfficialFallback'),
      ],
      [{ field: 'authHeaderValue', write: value => this.writeAuth(value) }],
    )
    this.store = this.form.bind(() => this.projection())
    this.unsubscribe = scope.subscribe(() => { void this.refreshAuth() })
    void this.refreshAuth()
  }

  private projection(): SearxngSearchCardState {
    return {
      ...this.form.shell(),
      mode: this.form.field('mode'),
      managedPort: this.form.field('managedPort'),
      baseURL: this.form.field('baseURL'),
      engines: this.form.field('engines'),
      language: this.form.field('language'),
      authEnabled: this.form.field('authEnabled'),
      authHeaderName: this.form.field('authHeaderName'),
      authHeaderValue: this.form.field('authHeaderValue'),
      authConfigured: this.authStatus.configured,
      authWritable: this.authStatus.writable,
      authEndpoint: this.authStatus.endpoint,
      authBusy: this.authBusy,
      authFailed: this.authFailed,
      allowOfficialFallback: this.form.field('allowOfficialFallback'),
    }
  }

  /**
   * Build the face the page's slot registration injects.
   * @returns the page's snapshot and its form actions.
   */
  inject(): SearxngSearchCardFace {
    const actions = this.form.actions()
    return { hooks: { searxngSearchCard: this.store }, ...actions,
      edit: (field, text) => { actions.edit(field, text); if (field === 'baseURL' || field === 'authHeaderName') void this.refreshAuth() },
      resetField: field => { actions.resetField(field); if (field === 'baseURL' || field === 'authHeaderName') void this.refreshAuth() },
      discard: () => { actions.discard(); void this.refreshAuth() },
      clearAuth: () => { void this.clearAuth() },
    }
  }

  private target(): InstanceAuthTarget {
    return { baseURL: this.form.field('baseURL').text, headerName: this.form.field('authHeaderName').text }
  }

  private async refreshAuth(): Promise<void> {
    if (!this.auth || this.scope.getSnapshot().status !== 'ready' || this.disposed) return
    const revision = ++this.revision
    this.authStatus = { endpoint: '', configured: false, writable: false }
    this.store.set(this.projection())
    try {
      const status = await this.auth.describe(this.target())
      if (this.disposed || revision !== this.revision) return
      this.authStatus = status
    } catch {
      // A bad draft or unavailable RPC never hides the ordinary search settings.
      if (this.disposed || revision !== this.revision) return
    }
    this.store.set(this.projection())
  }

  private async writeAuth(value: string): Promise<boolean> {
    if (!this.auth) return false
    const revision = ++this.revision
    const status = await this.auth.set(this.target(), value)
    if (!this.disposed && revision === this.revision) this.authStatus = status
    return status.configured
  }

  private async clearAuth(): Promise<void> {
    if (!this.auth || this.authBusy || this.form.shell().dirty || !this.authStatus.writable) return
    this.authBusy = true; this.authFailed = false
    const revision = ++this.revision
    this.store.set(this.projection())
    try {
      const status = await this.auth.clear(this.target())
      if (revision === this.revision) this.authStatus = status
    }
    catch { this.authFailed = true }
    finally { this.authBusy = false; if (!this.disposed) this.store.set(this.projection()) }
  }

  /** Release configuration subscriptions. */
  dispose(): void { this.disposed = true; this.unsubscribe(); this.form.dispose() }
}
