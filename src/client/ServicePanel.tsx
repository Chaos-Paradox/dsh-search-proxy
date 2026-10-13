/** Live operator status, first-use disclosure, bounded activity and a real search report. */
import { useEffect, useRef, useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SearchTestReport, ServiceMethod, ServiceStatus } from '../runtime-types.ts'
import type { SearxngSearchCardFace } from './searxng-search-card-controller.ts'
import type { SearxngSearchSettingsLocaleKey } from './locales.ts'

const labels = { idle: 'serviceIdle', 'needs-setup': 'serviceNeedsSetup', preparing: 'servicePreparing', starting: 'serviceStarting', ready: 'serviceReady', stopped: 'serviceStopped', failed: 'serviceFailed', external: 'serviceExternal' } as const
const stages = { uv: 'setupUv', source: 'setupSource', python: 'setupPython', dependencies: 'setupDependencies' } as const
const activityLabels = { download: 'activityDownload', verify: 'activityVerify', extract: 'activityExtract', command: 'activityCommand', cache: 'activityCache', configure: 'activityConfigure', ready: 'activityReady', stop: 'activityStop', cleanup: 'activityCleanup', test: 'activityTest', error: 'activityError' } as const
const failureLabels = { configuration: 'testConfiguration', authentication: 'testAuthentication', connection: 'testConnection', http: 'testHttpFailure', response: 'testResponse', cancelled: 'testCancelled' } as const
const verificationLabels = { sha256: 'verifyHash', 'tool-managed': 'verifyTool', 'package-index': 'verifyPackages' } as const
const secondary = { fontSize: 'var(--dsh-content-font-size-secondary, 13px)', color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.5 }

export function ServicePanel({ call, t, writable }: {
  call: SearxngSearchCardFace['serviceCall']; writable: boolean; t: (key: SearxngSearchSettingsLocaleKey) => string
}) {
  const [status, setStatus] = useState<ServiceStatus>({ phase: 'idle', endpoint: '', message: '', logs: '' })
  const [error, setError] = useState('')
  const [pollError, setPollError] = useState('')
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
    if (!call) return
    const controller = new AbortController()
    lifetime.current = controller
    setPending(undefined)
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      try {
        const next = await call('status', AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]))
        if (!controller.signal.aborted && typeof next !== 'number' && 'phase' in next) { setStatus(next); setPollError('') }
      } catch (e) { if (!controller.signal.aborted) setPollError(String(e)) }
      if (!controller.signal.aborted) timer = setTimeout(() => { void poll() }, 1500)
    }
    void poll()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [call])
  const action = async (method: 'prepare' | 'restart' | 'stop' | 'cleanup' | 'testReport') => {
    const controller = lifetime.current
    if (!call || !controller) return
    setPending(method); setError(''); setCopyState('idle')
    if (method === 'prepare' || method === 'restart') setRecordOpen(true)
    const operation = new AbortController()
    if (method === 'testReport') { testController.current = operation; setReportOpen(true); setReport(undefined); setTestStartedAt(Date.now()); setCancelled(false) }
    try {
      const next = await call(method, AbortSignal.any([controller.signal, operation.signal, AbortSignal.timeout(45000)]))
      if (controller.signal.aborted) return
      if (operation.signal.aborted) { setError(t('testCancelled')); return }
      if (typeof next !== 'number' && 'phase' in next) setStatus(next)
      else if (typeof next !== 'number') setReport(next)
    } catch (e) { if (!controller.signal.aborted) setError(operation.signal.aborted ? t('testCancelled') : String(e)) }
    finally { if (!controller.signal.aborted) { setPending(undefined); testController.current = undefined } }
  }
  const busy = pending !== undefined
  const testing = pending === 'testReport'
  const currentReport = testing || cancelled ? undefined : report ?? (status.testReport && Date.parse(status.testReport.time) >= testStartedAt ? status.testReport : undefined)
  const stage = Object.hasOwn(stages, status.message) ? t(stages[status.message as keyof typeof stages]) : status.message
  const activityText = (status.activities ?? []).map(event => event.time + ' ' + t(activityLabels[event.kind]) + ' ' + event.subject + '\n' + event.detail).join('\n\n')
  const components = status.setup && <details><summary>{t('setupComponents')}</summary><ul style={{ ...secondary, overflowWrap: 'anywhere' }}>{status.setup.components.map(component => <li key={component.name}>
    {component.name} {component.version}<br />{component.source}<br />{t(verificationLabels[component.verification])}
  </li>)}</ul></details>
  return <section aria-label={t('serviceTitle')} style={{ marginBottom: 20 }}>
    <p role="status"><strong>{t('serviceTitle')}: {t(labels[status.phase])}</strong>{stage ? ' · ' + stage : ''}</p>
    {status.endpoint && <p style={secondary}>{t('activeEndpoint')}: {status.endpoint}</p>}
    {status.phase === 'needs-setup' && <div style={{ padding: 12, marginBottom: 12, background: 'var(--dsw-alias-bg-layer-2)', borderRadius: 8 }}>
      <p>{t('setupSummary')}</p><p style={secondary}>{t('setupScope')}</p>
      {status.setup && <p style={{ ...secondary, overflowWrap: 'anywhere' }}>{t('setupDirectory')}: {status.setup.directory}</p>}
      {components}
    </div>}
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
      {status.phase !== 'external' && <>
        <Button variant="outline" size="sm" disabled={!call || busy || !writable || status.phase === 'idle'} onClick={() => { void action(status.phase === 'needs-setup' ? 'prepare' : 'restart') }}>{t(status.phase === 'needs-setup' ? 'servicePrepare' : 'serviceRestart')}</Button>
        <Button variant="outline" size="sm" disabled={!call || busy || !writable || ['idle', 'needs-setup', 'stopped'].includes(status.phase)} onClick={() => { void action('stop') }}>{t('serviceStop')}</Button>
      </>}
      <Button variant="outline" size="sm" disabled={!call || busy || !status.endpoint} onClick={() => { void action('testReport') }}>{t(testing ? 'testRunning' : 'serviceTest')}</Button>
      {testing && <Button variant="outline" size="sm" disabled={cancelled} onClick={() => { setCancelled(true); testController.current?.abort() }}>{t('testCancel')}</Button>}
    </div>
    {currentReport && <p role="status">{currentReport.outcome === 'failed' ? t('testFailed') : currentReport.outcome === 'empty' ? t('testEmpty') : t('serviceTestResult') + ': ' + currentReport.sourceCount}</p>}
    {(error || pollError) && <p role="alert">{error || pollError}</p>}
    <details open={recordOpen} onToggle={event => setRecordOpen(event.currentTarget.open)}>
      <summary>{t('serviceLogs')}</summary><p style={secondary}>{t('activitySession')}</p>
      {(status.activities ?? []).length ? <ol style={{ ...secondary, paddingLeft: 20 }}>
        {status.activities!.map((event, index) => <li key={event.time + index} style={{ margin: '10px 0' }}>
          <time>{new Date(event.time).toLocaleTimeString()}</time>{' · '}<strong>{t(activityLabels[event.kind])} {event.subject}</strong>
          {event.detail && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: '4px 0', font: 'inherit' }}>{event.detail}</pre>}
        </li>)}
      </ol> : <p style={secondary}>{t('activityEmpty')}</p>}
      {status.logs && <details><summary>{t('diagnosticOutput')}</summary><pre style={{ ...secondary, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 240, overflow: 'auto' }}>{status.logs}</pre></details>}
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
  </section>
}
