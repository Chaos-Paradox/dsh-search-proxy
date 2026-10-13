/**
 * The SearXNG search page's staged form over the `web-search-searxng` settings
 * namespace. Optional credentials are write-only and stored separately by the Host;
 * one save covers settings and a staged credential.
 */
import type { SettingsFieldState, SettingsFormActions, SettingsFormShell, SettingsFormScope } from '@deepseek-ai/dsh-client-ui-primitives';
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store';
import type { ServiceMethod, ServiceMode, ServiceResponse } from '../runtime-types.ts';
import type { InstanceAuthStatus, InstanceAuthTarget } from '../auth-types.ts';
export interface InstanceAuthClient {
    describe(target: InstanceAuthTarget): Promise<InstanceAuthStatus>;
    set(target: InstanceAuthTarget, value: string): Promise<InstanceAuthStatus>;
    clear(target: InstanceAuthTarget): Promise<InstanceAuthStatus>;
}
/**
 * Namespace of the SearXNG search provider. Spelled here rather than
 * imported: a client package must not depend on a Host package.
 */
export declare const SEARXNG_SEARCH_NS = "web-search-searxng";
/** The search-provider fields this page edits. */
export interface SearxngSearchSettings {
    mode?: ServiceMode;
    managedPort?: number;
    /** Instance endpoint; blank inherits `$SEARXNG_BASE_URL`. */
    baseURL?: string;
    /** Comma-separated engine restriction; blank uses the instance default. */
    engines?: string;
    /** Preferred result language; blank uses the instance default. */
    language?: string;
    authEnabled?: boolean;
    authHeaderName?: string;
    /**
     * Per-request official fallback: `true` permits one official attempt only
     * when the host exposes public `web.searchWithProvider` dispatch. Unpatched
     * DSH 0.2.1-alpha.2 reports the capability limit after a primary failure.
     * A served fallback carries a cost notice in the result.
     * Absent keeps the strict default: failures fail loudly, zero official
     * requests. The page renders this as a switch, never a text input.
     */
    allowOfficialFallback?: boolean;
}
/** What the SearXNG search page renders. */
export interface SearxngSearchCardState extends SettingsFormShell {
    mode: SettingsFieldState;
    managedPort: SettingsFieldState;
    /** Instance endpoint. */
    baseURL: SettingsFieldState;
    /** Engine restriction. */
    engines: SettingsFieldState;
    /** Result language. */
    language: SettingsFieldState;
    authEnabled: SettingsFieldState;
    authHeaderName: SettingsFieldState;
    /** A draft only; saved values never return from the Host. */
    authHeaderValue: SettingsFieldState;
    authConfigured: boolean;
    authWritable: boolean;
    authEndpoint: string;
    authBusy: boolean;
    authFailed: boolean;
    /** Official-fallback switch state ('true' when allowed); never rendered as an input. */
    allowOfficialFallback: SettingsFieldState;
}
/** The registration-side face the SearXNG search page's slot entry injects. */
export interface SearxngSearchCardFace extends SettingsFormActions {
    clearAuth: () => void;
    serviceCall?: (method: ServiceMethod, signal: AbortSignal) => Promise<ServiceResponse>;
    hooks: {
        /** Page snapshot bound by the renderer as useSearxngSearchCard. */
        searxngSearchCard: SnapshotStore<SearxngSearchCardState>;
    };
}
/** Bridges the `web-search-searxng` scope onto the page. */
export declare class SearxngSearchCardController {
    private readonly scope;
    private readonly auth?;
    private readonly form;
    private readonly store;
    private readonly unsubscribe;
    private authStatus;
    private authBusy;
    private authFailed;
    private revision;
    private disposed;
    /**
     * @param scope - the bound settings scope for the `web-search-searxng` namespace.
     */
    constructor(scope: SettingsFormScope<SearxngSearchSettings>, auth?: InstanceAuthClient | undefined);
    private projection;
    /**
     * Build the face the page's slot registration injects.
     * @returns the page's snapshot and its form actions.
     */
    inject(): SearxngSearchCardFace;
    private target;
    private refreshAuth;
    private writeAuth;
    private clearAuth;
    /** Release configuration subscriptions. */
    dispose(): void;
}
//# sourceMappingURL=searxng-search-card-controller.d.ts.map