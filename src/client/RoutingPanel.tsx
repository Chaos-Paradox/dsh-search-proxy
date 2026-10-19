/** Cost disclosure and an explicit, verified operator route restoration. */
import { useEffect, useRef, useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { RouteRestoreResult, RouteRestoreStatus, RoutingStatus } from '../runtime-types.ts'
import type { SearxngSearchSettingsLocaleKey as Key } from './locales.ts'

type Risk = 'paid' | 'unknown' | 'local'
function describe(routing: RoutingStatus | undefined, operation: 'search' | 'fetch'): { risk: Risk; detail: Key } {
  const id = operation === 'search' ? routing?.searchProvider : routing?.fetchProvider
  const source = operation === 'search' ? routing?.searchSource : routing?.fetchSource
  if (source !== 'configuration' || !id) return { risk: 'unknown', detail: 'routingUnconfirmed' }
  if (id === (operation === 'search' ? 'deepseek-search-api' : 'deepseek-fetch-api')) return { risk: 'paid', detail: 'routingDirectApi' }
  if (operation === 'search' && id === 'deepseek-official') return { risk: 'paid', detail: 'routingMessages' }
  if (operation === 'fetch' && id === 'http') return { risk: 'local', detail: 'routingHttp' }
  if (id === (operation === 'search' ? 'searxng' : 'searxng-http')) {
    if (!routing?.fallback) return { risk: 'unknown', detail: 'routingPermissionUnknown' }
    if (operation === 'search' && routing.fallback.searchApi || operation === 'fetch' && routing.fallback.fetchApi) return { risk: 'paid', detail: 'routingFallbackOn' }
    if (operation === 'search' && routing.fallback.legacySearch) return { risk: 'paid', detail: 'routingLegacyOn' }
    return { risk: 'local', detail: 'routingFallbackOff' }
  }
  return { risk: 'unknown', detail: 'routingOther' }
}

export function RoutingPanel({ routing, fresh, checkedAt, failed, refresh, canRefresh, routeRestore, restore, writable = false, draft = false, t }: {
  routing?: RoutingStatus; fresh: boolean; checkedAt: number; failed: boolean
  routeRestore?: RouteRestoreStatus; restore?: (expectedRevision: string, signal: AbortSignal) => Promise<RouteRestoreResult>
  writable?: boolean; draft?: boolean
  refresh(): void; canRefresh: boolean; t(key: Key): string
}) {
  const [confirmation, setConfirmation] = useState<{ revision: string; routing: RoutingStatus }>()
  const [restoring, setRestoring] = useState(false)
  const [outcome, setOutcome] = useState<RouteRestoreResult['outcome']>()
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const current = fresh ? routing : undefined
  const search = describe(current, 'search'), fetch = describe(current, 'fetch')
  const risk = [search.risk, fetch.risk].includes('paid') ? 'paid' : [search.risk, fetch.risk].includes('unknown') ? 'unknown' : 'local'
  const sourceLabels = { configuration: 'routingSourceConfig', environment: 'routingSourceEnv', automatic: 'routingSourceAuto', unavailable: 'routingSourceUnknown' } as const
  const bypassed = current && (current.searchProvider && current.searchProvider !== 'searxng' || current.fetchProvider && current.fetchProvider !== 'searxng-http')
  const restored = current?.searchSource === 'configuration' && current.fetchSource === 'configuration'
    && current.searchProvider === 'searxng' && current.fetchProvider === 'searxng-http'
  const canRestore = !!current && !!restore && writable && !draft && routeRestore?.capability === 'available' && !restoring
  const changed = confirmation && (!fresh || confirmation.revision !== routeRestore?.revision)
  const outcomeKeys = { restored: 'routeRestoreSuccess', changed: 'routeRestoreChanged', blocked: 'routeRestoreBlocked', 'read-only': 'routeRestoreReadOnly', unavailable: 'routeRestoreUnavailable', failed: 'routeRestoreFailed' } as const
  const apply = async () => {
    if (!confirmation || !canRestore || changed || !restore) return
    setRestoring(true); setOutcome(undefined)
    try {
      const result = await restore(confirmation.revision, AbortSignal.timeout(45000))
      if (mounted.current) setOutcome(result.outcome)
    } catch { if (mounted.current) setOutcome('failed') }
    finally {
      if (mounted.current) { setRestoring(false); setConfirmation(undefined); refresh() }
    }
  }
  return <section aria-label={t('routingTitle')} className="sx-card sx-routing" data-risk={risk}>
    <div className="sx-header"><h3>{t('routingTitle')}</h3><strong className="sx-route-risk">{t(risk === 'paid' ? 'routingPaid' : risk === 'unknown' ? 'routingUnknown' : 'routingLocal')}</strong></div>
    {failed && <p role="alert">{t('routingStale')}</p>}
    <dl className="sx-route-list">{(['search', 'fetch'] as const).map(operation => {
      const id = operation === 'search' ? current?.searchProvider : current?.fetchProvider
      const source = operation === 'search' ? current?.searchSource : current?.fetchSource
      const detail = operation === 'search' ? search : fetch
      return <div key={operation} data-risk={detail.risk}>
        <dt>{t(operation === 'search' ? 'routingSearch' : 'routingFetch')}</dt>
        <dd><code>{id ?? t('routingUnknownProvider')}</code><p className="sx-muted">{t(sourceLabels[source ?? 'unavailable'])}</p><p>{t(detail.detail)}</p></dd>
      </div>
    })}</dl>
    {current?.fallback && <p className="sx-muted">{t('routingSavedPermissions')}: {t('routingSearch')} {t(current.fallback.searchApi ? 'routingOn' : 'routingOff')} · {t('routingFetch')} {t(current.fallback.fetchApi ? 'routingOn' : 'routingOff')}
      {current.fallback.legacySearch && <> · {t('routingLegacyOn')}</>}</p>}
    {bypassed && <p>{t('routingRestoreHint')}</p>}
    {!restored && <div className="sx-note">
      <Button variant="outline" size="sm" disabled={!canRestore || !!confirmation} onClick={() => {
        if (canRestore && routeRestore && current) { setOutcome(undefined); setConfirmation({ revision: routeRestore.revision, routing: current }) }
      }}>{t('routeRestoreButton')}</Button>
      {draft ? <p>{t('routeRestoreDraft')}</p> : !writable || routeRestore?.capability === 'read-only' ? <p>{t('routeRestoreReadOnly')}</p>
        : (!restore || routeRestore?.capability !== 'available') && <p>{t('routeRestoreUnavailable')}</p>}
      {confirmation && <div role="group" aria-label={t('routeRestoreConfirmTitle')}>
        <p><strong>{t('routeRestoreConfirmTitle')}</strong></p>
        <p>{t('routingSearch')}: <code>{confirmation.routing.searchProvider ?? t('routingUnknownProvider')} → searxng</code></p>
        <p>{t('routingFetch')}: <code>{confirmation.routing.fetchProvider ?? t('routingUnknownProvider')} → searxng-http</code></p>
        <p>{t('routeRestoreKeepPermissions')}</p>
        {changed && <p role="alert">{t('routeRestoreChanged')}</p>}
        <div className="sx-actions"><Button variant="outline" size="sm" disabled={!canRestore || !!changed} onClick={() => { void apply() }}>{t(restoring ? 'routeRestorePending' : 'routeRestoreConfirm')}</Button>
          <Button variant="outline" size="sm" disabled={restoring} onClick={() => setConfirmation(undefined)}>{t('routeRestoreCancel')}</Button></div>
      </div>}
    </div>}
    {outcome && <p role={outcome === 'restored' ? 'status' : 'alert'}>{t(outcomeKeys[outcome])}</p>}
    <details><summary>{t('routeRestoreManual')}</summary>
      <p>{t('routeRestoreManualSteps')}</p>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 13 }}><code>{'- id: web\n  config:\n    searchProvider: searxng\n    fetchProvider: searxng-http'}</code></pre>
      <p>{t('routeRestoreBlocked')}</p><p>{t('routeRestoreKeepPermissions')}</p>
    </details>
    <p className="sx-muted">{t('routingTestOnly')}</p>
    <p className="sx-muted">{t('routingScope')}</p>
    <div className="sx-actions"><Button variant="outline" size="sm" disabled={!canRefresh} onClick={refresh}>{t('routingRefresh')}</Button>
      <span className="sx-muted">{fresh && checkedAt ? <>{t('routingCheckedAt')}: <time dateTime={new Date(checkedAt).toISOString()}>{new Date(checkedAt).toLocaleTimeString()}</time></> : t('routingUnknown')}</span></div>
  </section>
}
