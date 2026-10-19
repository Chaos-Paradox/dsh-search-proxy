import type { RouteRestoreResult, RouteRestoreStatus, RoutingStatus } from '../runtime-types.ts';
import type { SearxngSearchSettingsLocaleKey as Key } from './locales.ts';
export declare function RoutingPanel({ routing, fresh, checkedAt, failed, refresh, canRefresh, routeRestore, restore, writable, draft, t }: {
    routing?: RoutingStatus;
    fresh: boolean;
    checkedAt: number;
    failed: boolean;
    routeRestore?: RouteRestoreStatus;
    restore?: (expectedRevision: string, signal: AbortSignal) => Promise<RouteRestoreResult>;
    writable?: boolean;
    draft?: boolean;
    refresh(): void;
    canRefresh: boolean;
    t(key: Key): string;
}): import("react").JSX.Element;
//# sourceMappingURL=RoutingPanel.d.ts.map