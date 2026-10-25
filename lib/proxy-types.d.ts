/** Client-safe proxy contract. Saved endpoints and consent remain on the backend. */
export declare const PROXY_RISK_REVISION = "2026-10-19-v3";
export declare const PROXY_RISK_URL = "https://github.com/Chaos-Paradox/dsh-search-proxy/blob/main/docs/proxy-risk.zh.md";
export declare const PROXY_RISK_URL_EN = "https://github.com/Chaos-Paradox/dsh-search-proxy/blob/main/docs/proxy-risk.md";
export interface ProxyConfiguration {
    protocol: 'http' | 'https';
    host: string;
    port: number;
    noProxy: string;
}
export interface ProxyStatus {
    state: 'off' | 'active' | 'inherited' | 'unavailable';
    riskRevision: string;
    remembered?: boolean;
    restoreFailed?: boolean;
}
export interface ProxyApproval {
    step: 'notice' | 'statement' | 'approved';
    token: string;
    riskRevision: string;
}
export type ProxyMethod = 'proxyStatus' | 'proxyBegin' | 'proxyConfirm' | 'proxyApply' | 'proxyRemove' | 'proxyResume' | 'proxyForget';
export type ProxyResponse = ProxyStatus | ProxyApproval;
export type ProxyCall = (method: ProxyMethod, args: Record<string, unknown>) => Promise<ProxyResponse>;
export declare function parseProxyResponse(value: unknown): ProxyResponse;
//# sourceMappingURL=proxy-types.d.ts.map