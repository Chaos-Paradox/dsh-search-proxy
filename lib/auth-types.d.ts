/** Client-safe contract for optional instance authentication. Values are write-only. */
export interface InstanceAuthTarget {
    baseURL: string;
    headerName: string;
}
export interface InstanceAuthStatus {
    endpoint: string;
    configured: boolean;
    writable: boolean;
}
export interface InstanceAuthHeader {
    name: string;
    value: string;
}
export declare const DEFAULT_AUTH_HEADER = "X-API-Key";
/** Authentication must not override request routing, framing, or the JSON contract. */
export declare function validAuthHeaderName(name: string): boolean;
/** Fetch accepts Latin-1 header values; reject control characters without echoing a secret. */
export declare function validAuthHeaderValue(value: string): boolean;
export declare function parseInstanceAuthStatus(value: unknown): InstanceAuthStatus;
//# sourceMappingURL=auth-types.d.ts.map