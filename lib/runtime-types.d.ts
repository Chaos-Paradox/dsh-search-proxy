/** JSON values shared by the Host manager and browser card. */
export type ServiceMode = 'auto' | 'local' | 'external';
export type ServicePhase = 'idle' | 'needs-setup' | 'preparing' | 'starting' | 'ready' | 'stopped' | 'failed' | 'external';
/** Operator-only activity; paths and secrets are removed before recording. */
export interface RuntimeActivity {
    time: string;
    kind: 'download' | 'verify' | 'extract' | 'command' | 'cache' | 'configure' | 'ready' | 'stop' | 'cleanup' | 'test' | 'error';
    subject: string;
    detail: string;
}
/** First-use disclosure and the exact directory owned by this plugin. */
export interface RuntimeSetupInfo {
    directory: string;
    cached: boolean;
    components: {
        name: string;
        version: string;
        source: string;
        verification: 'sha256' | 'tool-managed' | 'package-index';
    }[];
}
/** One real query, without credential values or arbitrary exception text. */
export interface SearchTestReport {
    /** Managed instance that received the query, even if it stopped before completion. */
    instanceId?: string;
    time: string;
    query: string;
    endpoint: string;
    engines: string;
    language: string;
    authUsed: boolean;
    officialFallbackUsed: false;
    outcome: 'success' | 'empty' | 'failed';
    failureStage: 'configuration' | 'authentication' | 'connection' | 'http' | 'response' | 'cancelled' | null;
    httpStatus: number | null;
    responseFormat: 'json' | 'invalid' | 'unavailable';
    elapsedMs: number;
    sourceCount: number;
    sources: {
        url: string;
        title?: string;
    }[];
    message: string;
}
/** A bounded service snapshot; no model or API credentials are included. */
export interface ServiceStatus {
    /** Configured routes read through the public settings service; absent when unavailable. */
    routing?: RoutingStatus;
    routeRestore?: RouteRestoreStatus;
    /** Random per-launch identity; no host, port or credential data. */
    instanceId?: string;
    phase: ServicePhase;
    endpoint: string;
    message: string;
    logs: string;
    setup?: RuntimeSetupInfo;
    activities?: RuntimeActivity[];
    testReport?: SearchTestReport;
}
export type RouteSource = 'configuration' | 'environment' | 'automatic' | 'unavailable';
/** Selection intent, not provider availability or an account billing receipt. */
export interface RoutingStatus {
    searchProvider: string | null;
    fetchProvider: string | null;
    searchSource?: RouteSource;
    fetchSource?: RouteSource;
    /** Saved permissions read from the same live fields used by request dispatch. */
    fallback?: {
        searchApi: boolean;
        fetchApi: boolean;
        legacySearch: boolean;
    };
}
export interface RouteRestoreStatus {
    capability: 'available' | 'read-only' | 'unavailable';
    /** Opaque selection and saved-permission revision; never a credential. */
    revision: string;
}
export interface RouteRestoreResult {
    outcome: 'restored' | 'changed' | 'blocked' | 'read-only' | 'unavailable' | 'failed';
    routing: RoutingStatus;
}
export declare function parseRouteRestoreResult(value: unknown): RouteRestoreResult;
export type ServiceMethod = 'status' | 'prepare' | 'restart' | 'stop' | 'cleanup' | 'test' | 'testReport';
export type ServiceResponse = ServiceStatus | SearchTestReport | number;
/** Validate the diagnostic response without admitting executable source links. */
export declare function parseSearchTestReport(value: unknown): SearchTestReport;
/** Validate a response received over the authenticated Connection carrier. */
export declare function parseServiceStatus(value: unknown): ServiceStatus;
//# sourceMappingURL=runtime-types.d.ts.map