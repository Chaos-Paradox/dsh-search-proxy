/** Live operator status, first-use disclosure, bounded activity and a real search report. */
import { useEffect, useRef, useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SearchTestReport, ServiceMethod, ServiceStatus } from '../runtime-types.ts'
import type { SearxngSearchCardFace } from './searxng-search-card-controller.ts'
import type { SearxngSearchSettingsLocaleKey } from './locales.ts'
import { RoutingPanel } from './RoutingPanel.tsx'

const labels = { idle: 'serviceIdle', 'needs-setup': 'serviceNeedsSetup', preparing: 'servicePreparing', starting: 'serviceStarting', ready: 'serviceReady', stopped: 'serviceStopped', failed: 'serviceFailed', external: 'serviceExternal' } as const
const stages = { uv: 'setupUv', source: 'setupSource', python: 'setupPython', dependencies: 'setupDependencies' } as const
const activityLabels = { download: 'activityDownload', verify: 'activityVerify', extract: 'activityExtract', command: 'activityCommand', cache: 'activityCache', configure: 'activityConfigure', ready: 'activityReady', stop: 'activityStop', cleanup: 'activityCleanup', test: 'activityTest', error: 'activityError' } as const
const stopReasons = {
  'service-start': 'stopStart', 'service-stop': 'stopService', 'configuration-change': 'stopConfiguration',
  'operator-prepare': 'stopPrepare', 'operator-restart': 'stopRestart', 'operator-stop': 'stopOperator',
  'external-mode': 'stopExternal', 'runtime-cleanup': 'stopCleanup', 'plugin-disposed': 'stopPlugin',
  'subprocess-service-disposed': 'stopDependency', 'startup-failed': 'stopStartupFailure',
  'unexpected-exit-recovery': 'stopRecovery', 'recovery-failed': 'stopRecoveryFailure',
} as const

function reportIsCurrent(report: SearchTestReport, status: ServiceStatus): boolean {
  if (!['ready', 'external'].includes(status.phase) || report.instanceId !== status.instanceId) return false
  try {
    const endpoint = new URL('search', status.endpoint.endsWith('/') ? status.endpoint : `${status.endpoint}/`)
    return report.endpoint === `${endpoint.origin}${endpoint.pathname}`
  } catch { return false }
}
const failureLabels = { configuration: 'testConfiguration', authentication: 'testAuthentication', connection: 'testConnection', http: 'testHttpFailure', response: 'testResponse', cancelled: 'testCancelled' } as const
const verificationLabels = { sha256: 'verifyHash', 'tool-managed': 'verifyTool', 'package-index': 'verifyPackages' } as const
const secondary = { fontSize: 'var(--dsh-content-font-size-secondary, 13px)', color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.5 }

export function ServicePanel({ call, restoreRoutesCall, draft = false, t, writable }: {
  call: SearxngSearchCardFace['serviceCall']; restoreRoutesCall?: SearxngSearchCardFace['restoreRoutesCall']; draft?: boolean
  writable: boolean; t: (key: SearxngSearchSettingsLocaleKey) => string
}) {
  const [status, setStatus] = useState<ServiceStatus>({ phase: 'idle', endpoint: '', message: '', logs: '' })
  const [error, setError] = useState('')
  const [pollError, setPollError] = useState('')
  const [routingFresh, setRoutingFresh] = useState(false)
  const [routingCheckedAt, setRoutingCheckedAt] = useState(0)
  const [refreshRevision, setRefreshRevision] = useState(0)
  const statusRevision = useRef(0)
  const routingCall = useRef<typeof call>(undefined)
  const [report, setReport] = useState<SearchTestReport | undefined>()
  const [testStartedAt, setTestStartedAt] = useState(0)
  const [cancelled, setCancelled] = useState(false)
  const [pending, setPending] = useState<ServiceMethod | undefined>()
  const [recordOpen, setRecordOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [confirmCleanup, setConfirmCleanup] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const lifetime = useRef<AbortController | undefined>(undefined)
  const testController = useRef<AbortController | undefined>(undefined)
  useEffect(() => {
    setRoutingFresh(false)
    if (!call) return
    const controller = new AbortController()
    lifetime.current = controller
    setPending(undefined)
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      const revision = ++statusRevision.current
      try {
        const next = await call('status', AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]))
        if (typeof next === 'number' || !('phase' in next)) throw new Error('Invalid service status')
        if (!controller.signal.aborted && revision === statusRevision.current) { routingCall.current = call; setStatus(next); setPollError(''); setRoutingFresh(true); setRoutingCheckedAt(Date.now()) }
      } catch (e) { if (!controller.signal.aborted && revision === statusRevision.current) { setPollError(String(e)); setRoutingFresh(false) } }
      if (!controller.signal.aborted) timer = setTimeout(() => { void poll() }, 1500)
    }
    void poll()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [call, refreshRevision])
  useEffect(() => {
    const refresh = () => { if (document.visibilityState !== 'hidden') { setRoutingFresh(false); setRefreshRevision(value => value + 1) } }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  const action = async (method: 'prepare' | 'restart' | 'stop' | 'cleanup' | 'testReport') => {
    const controller = lifetime.current
    if (!call || !controller) return
    setPending(method); setError(''); setCopyState('idle')
    if (method === 'prepare' || method === 'restart') setRecordOpen(true)
    const operation = new AbortController()
    const revision = ++statusRevision.current
    if (method === 'testReport') { testController.current = operation; setReportOpen(true); setReport(undefined); setTestStartedAt(Date.now()); setCancelled(false) }
    try {
      const next = await call(method, AbortSignal.any([controller.signal, operation.signal, AbortSignal.timeout(45000)]))
      if (controller.signal.aborted) return
      if (operation.signal.aborted) { setError(t('testCancelled')); return }
      if (typeof next !== 'number' && 'phase' in next) {
        if (revision === statusRevision.current) { routingCall.current = call; setStatus(next); setRoutingFresh(true); setRoutingCheckedAt(Date.now()); setPollError('') }
      }
      else if (typeof next !== 'number') setReport(next)
    } catch (e) { if (!controller.signal.aborted) setError(operation.signal.aborted ? t('testCancelled') : String(e)) }
    finally { if (!controller.signal.aborted) { setPending(undefined); testController.current = undefined } }
  }
  const busy = pending !== undefined
  const testing = pending === 'testReport'
  const currentReport = testing || cancelled ? undefined : report ?? (status.testReport && Date.parse(status.testReport.time) >= testStartedAt ? status.testReport : undefined)
  const historicalReport = currentReport && !reportIsCurrent(currentReport, status)
  const stage = Object.hasOwn(stages, status.message) ? t(stages[status.message as keyof typeof stages]) : status.message
  const eventDetail = (event: NonNullable<ServiceStatus['activities']>[number]) => event.kind === 'stop' && Object.hasOwn(stopReasons, event.detail)
    ? t(stopReasons[event.detail as keyof typeof stopReasons]) + ` (${event.detail})` : event.detail
  const activityText = (status.activities ?? []).map(event => event.time + ' ' + t(activityLabels[event.kind]) + ' ' + event.subject + '\n' + eventDetail(event)).join('\n\n')
  const components = status.setup && <details><summary>{t('setupComponents')}</summary><ul style={{ ...secondary, overflowWrap: 'anywhere' }}>{status.setup.components.map(component => <li key={component.name}>
    {component.name} {component.version}<br />{component.source}<br />{t(verificationLabels[component.verification])}
  </li>)}</ul></details>
  const logHints = [
    [/DSH_SEARXNG_READY/, 'logReadyHint'],
    [/Error while getting (?:the version|the git URL & branch)/, 'logGitHint'],
    [/(?:ahmia|torch): can't register engine/, 'logTorHint'],
    [/missing config file:.*limiter\.toml/, 'logLimiterHint'],
    [/X-Forwarded-For nor X-Real-IP header is set/, 'logForwardedHint'],
  ] as const
  return <><RoutingPanel routing={status.routing} fresh={routingFresh && routingCall.current === call} checkedAt={routingCheckedAt} failed={!!pollError}
    routeRestore={status.routeRestore} restore={restoreRoutesCall} writable={writable} draft={draft}
    canRefresh={!!call} refresh={() => { setRoutingFresh(false); setRefreshRevision(value => value + 1) }} t={t} />
    <section aria-label={t('serviceTitle')} className="sx-card">
    <div className="sx-header"><h3>{t('serviceTitle')}</h3><span role="status" className="sx-badge" data-phase={status.phase}>{t(labels[status.phase])}</span></div>
    {stage && <p className="sx-muted">{stage}</p>}
    {status.endpoint && <p style={secondary}>{t('activeEndpoint')}: {status.endpoint}</p>}
    {status.phase === 'needs-setup' && <div className="sx-note">
      <p>{t('setupSummary')}</p><p style={secondary}>{t('setupScope')}</p>
      {components}
    </div>}
    <div className="sx-actions">
      {status.phase !== 'external' && <>
        <Button variant="outline" size="sm" disabled={!call || busy || !writable || status.phase === 'idle'} onClick={() => { void action(status.phase === 'needs-setup' ? 'prepare' : 'restart') }}>{t(status.phase === 'needs-setup' ? 'servicePrepare' : 'serviceRestart')}</Button>
        <Button variant="outline" size="sm" disabled={!call || busy || !writable || ['idle', 'needs-setup', 'stopped'].includes(status.phase)} onClick={() => { void action('stop') }}>{t('serviceStop')}</Button>
      </>}
      <Button variant="outline" size="sm" disabled={!call || busy || !status.endpoint} onClick={() => { void action('testReport') }}>{t(testing ? 'testRunning' : 'serviceTest')}</Button>
      {testing && <Button variant="outline" size="sm" disabled={cancelled} onClick={() => { setCancelled(true); testController.current?.abort() }}>{t('testCancel')}</Button>}
    </div>
    {currentReport && <p role="status">{historicalReport ? t('testHistorical') : currentReport.outcome === 'failed' ? t('testFailed') : currentReport.outcome === 'empty' ? t('testEmpty') : t('serviceTestResult') + ': ' + currentReport.sourceCount}</p>}
    {(error || pollError) && <p role="alert">{error || pollError}</p>}
    <div className="sx-diagnostics">
    <details open={recordOpen} onToggle={event => setRecordOpen(event.currentTarget.open)}>
      <summary>{t('serviceLogs')}</summary><p style={secondary}>{t('activitySession')}</p>
      {(status.activities ?? []).length ? <ol style={{ ...secondary, paddingLeft: 20 }}>
        {status.activities!.map((event, index) => <li key={event.time + index} style={{ margin: '10px 0' }}>
          <time>{new Date(event.time).toLocaleTimeString()}</time>{' · '}<strong>{t(activityLabels[event.kind])} {event.subject}</strong>
          {event.detail && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: '4px 0', font: 'inherit' }}>{eventDetail(event)}</pre>}
        </li>)}
      </ol> : <p style={secondary}>{t('activityEmpty')}</p>}
      {status.logs && <details><summary>{t('diagnosticOutput')}</summary>
        <ul className="sx-log-hints">{logHints.filter(([pattern]) => pattern.test(status.logs)).map(([, key]) => <li key={key}>{t(key)}</li>)}</ul>
        <p className="sx-muted"><a href="https://github.com/Chaos-Paradox/dsh-web-search-searxng/blob/main/docs/managed-runtime.zh.md#启动日志怎么看" target="_blank" rel="noreferrer">{t('logHelp')}</a></p>
        <pre style={{ ...secondary, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 240, overflow: 'auto', padding: 12, borderRadius: 8, background: 'var(--sx-soft)' }}>{status.logs}</pre>
      </details>}
      <Button variant="outline" size="sm" disabled={!activityText && !status.logs} onClick={() => {
        void navigator.clipboard?.writeText(activityText + '\n\n' + status.logs).then(() => setCopyState('copied'), () => setCopyState('failed'))
        if (!navigator.clipboard) setCopyState('failed')
      }}>{t(copyState === 'copied' ? 'copiedLog' : 'copyLog')}</Button>
      {copyState === 'failed' && <p style={secondary}>{t('copyFailed')}</p>}
    </details>
    <details open={reportOpen} onToggle={event => setReportOpen(event.currentTarget.open)} style={{ marginTop: 10 }}>
      <summary>{t('testReportTitle')}</summary><p style={secondary}>{t('testHint')}</p>
      {testing && !cancelled && <p role="status">{t('testRunning')}</p>}
      {currentReport && <>
        <dl style={{ ...secondary, display: 'grid', gridTemplateColumns: 'minmax(0, 130px) minmax(0, 1fr)', gap: '6px 16px' }}>
          <dt>{t('testRequest')}</dt><dd style={{ marginLeft: 0, overflowWrap: 'anywhere' }}>{currentReport.query} · {currentReport.endpoint || t('testUnavailable')}</dd>
          <dt>{t('testHttp')}</dt><dd style={{ marginLeft: 0 }}>{currentReport.httpStatus ?? t('testUnavailable')}</dd>
          <dt>{t('testFormat')}</dt><dd style={{ marginLeft: 0 }}>{currentReport.responseFormat === 'json' ? 'JSON' : t('testUnavailable')}</dd>
          <dt>{t('engines')} / {t('language')}</dt><dd style={{ marginLeft: 0 }}>{currentReport.engines || t('enginesDefault')} / {currentReport.language || t('languageDefault')}</dd>
          <dt>{t('testSourceCount')}</dt><dd style={{ marginLeft: 0 }}>{currentReport.sourceCount}</dd>
          <dt>{t('testElapsed')}</dt><dd style={{ marginLeft: 0 }}>{currentReport.elapsedMs} ms · {new Date(currentReport.time).toLocaleTimeString()}</dd>
          <dt>{t('testAuth')} / {t('testFallback')}</dt><dd style={{ marginLeft: 0 }}>{t(currentReport.authUsed ? 'testYes' : 'testNo')} / {t('testNo')}</dd>
        </dl>
        {currentReport.failureStage && <p role="alert">{t(failureLabels[currentReport.failureStage])}{currentReport.message ? ' (' + currentReport.message + ')' : ''}</p>}
        {currentReport.sources.length > 0 && <ul>{currentReport.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title || source.url}</a></li>)}</ul>}
      </>}
    </details>
    {status.setup && <details style={{ marginTop: 10 }}>
      <summary>{t('runtimeDetails')}</summary><p style={secondary}>{t('serviceHint')}</p>
      <p style={{ ...secondary, overflowWrap: 'anywhere' }}>{t('setupDirectory')}: {status.setup.directory}</p>
      {status.phase !== 'needs-setup' && components}
      <p style={secondary}>{t('cleanupHint')}</p>
      <Button variant="outline" size="sm" disabled={!call || busy || !writable || ['preparing', 'starting'].includes(status.phase)}
        onClick={() => setConfirmCleanup(true)}>{t('runtimeCleanup')}</Button>
      {confirmCleanup && <div role="group" aria-label={t('runtimeCleanup')}>
        <p>{t('cleanupHint')}</p>
        <Button variant="outline" size="sm" disabled={busy || !writable} onClick={() => { setConfirmCleanup(false); setRecordOpen(true); void action('cleanup') }}>{t('cleanupConfirm')}</Button>{' '}
        <Button variant="outline" size="sm" onClick={() => setConfirmCleanup(false)}>{t('cleanupCancel')}</Button>
      </div>}
    </details>}
    </div>
  </section></>
}
