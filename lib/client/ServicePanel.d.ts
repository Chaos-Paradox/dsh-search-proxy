import type { SearxngSearchCardFace } from './searxng-search-card-controller.ts';
import type { SearxngSearchSettingsLocaleKey } from './locales.ts';
export declare function ServicePanel({ call, restoreRoutesCall, draft, t, writable }: {
    call: SearxngSearchCardFace['serviceCall'];
    restoreRoutesCall?: SearxngSearchCardFace['restoreRoutesCall'];
    draft?: boolean;
    writable: boolean;
    t: (key: SearxngSearchSettingsLocaleKey) => string;
}): import("react").JSX.Element;
//# sourceMappingURL=ServicePanel.d.ts.map