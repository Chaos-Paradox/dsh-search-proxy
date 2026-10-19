/** Visible connection fields; the switch requests consent before any proxy is installed. */
import { useEffect, useRef, useState } from 'react'
import { Button, Modal, Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import { PROXY_RISK_URL, PROXY_RISK_URL_EN } from '../proxy-types.ts'
import type { ProxyApproval, ProxyCall, ProxyResponse, ProxyStatus } from '../proxy-types.ts'
import type { SearxngSearchSettingsLocaleKey } from './locales.ts'

export function ProxyPanel({ call, t, writable }: { call?: ProxyCall; writable: boolean; t: (key: SearxngSearchSettingsLocaleKey) => string }) {
  const [status, setStatus] = useState<ProxyStatus['state']>('unavailable')
  const [approval, setApproval] = useState<ProxyApproval>()
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [remembered, setRemembered] = useState(false)
  const [host, setHost] = useState(''), [port, setPort] = useState(''), [noProxy, setNoProxy] = useState('')
  const [protocol, setProtocol] = useState<'http' | 'https'>('http')
  const mounted = useRef(false), working = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  useEffect(() => {
    let current = true
    void call?.('proxyStatus', {}).then(result => {
      if (current && 'state' in result) { setStatus(result.state); setRemembered(result.remembered === true); if (result.restoreFailed) setFailed(true) }
    }, () => { if (current) setFailed(true) })
    // A host slot may supply a fresh callback for the same connection. That refresh must not
    // erase consent or strand an in-flight operation; the server still validates every grant.
    return () => { current = false }
  }, [call])
  const clearFields = () => { setHost(''); setPort(''); setNoProxy(''); setProtocol('http'); setInvalid(false) }
  const receiveStatus = (result: ProxyResponse, clear: boolean) => {
    if (!('state' in result)) throw new Error('Invalid proxy state')
    setStatus(result.state); setApproval(undefined); setAck(false)
    setRemembered(result.remembered === true)
    if (clear) clearFields()
  }
  const operation = async (run: () => Promise<void>) => {
    if (!call || working.current || !writable) return
    working.current = true; setBusy(true); setFailed(false)
    try { await run() }
    catch {
      if (mounted.current) {
        setFailed(true); setApproval(undefined); setAck(false); clearFields()
        // Activation may have succeeded before a transport failure. Reconcile without replaying
        // a consumed grant so the switch still offers removal, without revealing the endpoint.
        try {
          const result = await call('proxyStatus', {})
          if (mounted.current && 'state' in result) { setStatus(result.state); setRemembered(result.remembered === true) }
        } catch { /* Keep the bounded error. */ }
      }
    } finally {
      working.current = false
      if (mounted.current) setBusy(false)
    }
  }
  const valid = !!host.trim() && /^\d+$/.test(port) && Number(port) >= 1 && Number(port) <= 65535
  const locked = !call || !writable || busy
  const requestEnable = () => {
    if (remembered) {
      void operation(async () => { const result = await call!('proxyResume', {}); if (mounted.current) receiveStatus(result, true) })
      return
    }
    if (!valid) { setInvalid(true); return }
    void operation(async () => {
      const next = await call!('proxyBegin', {})
      if (!('step' in next) || next.step !== 'notice') throw new Error('Invalid proxy consent')
      if (mounted.current) { setApproval(next); setAck(false); setInvalid(false) }
    })
  }
  const readStatement = () => {
    if (approval?.step !== 'notice') return
    void operation(async () => {
      const next = await call!('proxyConfirm', { token: approval.token, step: 'notice', revision: approval.riskRevision, accepted: false })
      if (!('step' in next) || next.step !== 'statement') throw new Error('Invalid proxy statement')
      if (mounted.current) { setApproval(next); setAck(false) }
    })
  }
  const enable = () => {
    if (!ack || !valid || approval?.step !== 'statement') return
    void operation(async () => {
      const grant = await call!('proxyConfirm', { token: approval.token, step: 'statement', revision: approval.riskRevision, accepted: true })
      if (!('step' in grant) || grant.step !== 'approved') throw new Error('Invalid proxy acknowledgement')
      const result = await call!('proxyApply', { token: grant.token, configuration: { protocol, host, port: Number(port), noProxy } })
      if (mounted.current) receiveStatus(result, true)
    })
  }
  const remove = (clear: boolean) => { void operation(async () => {
    const result = await call!('proxyRemove', {})
    if (mounted.current) receiveStatus(result, clear)
  }) }
  const forget = () => { void operation(async () => {
    const result = await call!('proxyForget', {})
    if (mounted.current) receiveStatus(result, true)
  }) }
  const statusKey = ({ off: 'proxyOff', active: 'proxyActive', inherited: 'proxyInherited', unavailable: 'proxyUnavailable' } as const)[status]
  return <section aria-label={t('proxyTitle')} className="sx-card sx-risk">
    <div className="sx-header"><h3>{t('proxyTitle')}</h3><span className="sx-risk-label">{t('proxyBadge')}</span></div>
    <p className="sx-muted">{t('proxyHint')}</p>
    <div className="sx-header">
      <span>{t('proxyToggle')}</span>
      <Switch label={t('proxyToggle')} checked={status === 'active'} disabled={locked || !['off', 'active'].includes(status) || !!approval}
        onChange={next => next ? requestEnable() : remove(true)} />
    </div>
    <p role="status" className="sx-muted">{t(statusKey)}</p>
    {remembered && <p className="sx-muted">{t('proxyRemembered')}</p>}
    {status !== 'active' && !remembered && <>
      <p className="sx-muted">{t('proxyPortGuide')}</p>
      <fieldset className="sx-plain-fieldset" disabled={locked || status !== 'off' || !!approval}>
        <div className="sx-proxy-grid">
          <div className="sx-field sx-wide"><label htmlFor="session-proxy-protocol">{t('proxyProtocol')}</label>
            <select id="session-proxy-protocol" value={protocol} onChange={event => setProtocol(event.currentTarget.value as 'http' | 'https')}><option value="http">HTTP</option><option value="https">HTTPS</option></select>
          </div>
          <div className="sx-field"><label htmlFor="session-proxy-host">{t('proxyHost')}</label>
            <input className="sx-input" id="session-proxy-host" autoComplete="off" aria-describedby="session-proxy-host-hint" aria-invalid={invalid && !host.trim() || undefined} value={host} onChange={event => setHost(event.currentTarget.value)} />
          </div>
          <div className="sx-field"><label htmlFor="session-proxy-port">{t('proxyPort')}</label>
            <input className="sx-input" id="session-proxy-port" type="number" min={1} max={65535} autoComplete="off" aria-describedby="session-proxy-port-hint" aria-invalid={invalid && !valid || undefined} value={port} onChange={event => setPort(event.currentTarget.value)} />
          </div>
          <p className="sx-muted sx-wide" id="session-proxy-host-hint">{t('proxyHostHint')}</p>
          <p className="sx-muted sx-wide" id="session-proxy-port-hint">{t('proxyPortHint')}</p>
          <div className="sx-field sx-wide"><label htmlFor="session-proxy-bypass">{t('proxyBypass')}</label>
            <input className="sx-input" id="session-proxy-bypass" autoComplete="off" aria-describedby="session-proxy-bypass-hint" value={noProxy} onChange={event => setNoProxy(event.currentTarget.value)} />
          </div>
          <p className="sx-muted sx-wide" id="session-proxy-bypass-hint">{t('proxyBypassHint')}</p>
        </div>
      </fieldset>
    </>}
    {invalid && <p role="alert">{t('proxyConfigRequired')}</p>}
    <p className="sx-muted"><a href={PROXY_RISK_URL} target="_blank" rel="noreferrer">{t('proxyDocs')}</a>{' · '}<a href={PROXY_RISK_URL_EN} target="_blank" rel="noreferrer">{t('proxyDocsEn')}</a></p>
    <details><summary>{t('proxySessionTitle')}</summary><p className="sx-muted">{t('proxySession')}</p></details>
    {status === 'active' && <div className="sx-actions"><Button variant="outline" size="sm" disabled={locked} onClick={() => remove(true)}>{t('proxyRemove')}</Button></div>}
    {remembered && <div className="sx-actions"><Button variant="outline" size="sm" disabled={locked} onClick={forget}>{t('proxyForget')}</Button></div>}
    {failed && <p role="alert">{t('proxyError')}</p>}
    <Modal open={!!approval} onClose={() => { if (!locked) remove(false) }} title={t('proxyDialogTitle')} closeLabel={t('proxyClose')}
      className="searxng-proxy-dialog" contentClassName="searxng-proxy-dialog-content"
      footer={<div className="searxng-settings"><div className="sx-actions">
        <Button variant="outline" size="sm" disabled={locked} onClick={() => remove(false)}>{t('proxyCancel')}</Button>
        <Button variant="primary" size="sm" disabled={locked || !ack || approval?.step !== 'statement' || !valid} onClick={enable}>{t('proxyApply')}</Button>
      </div></div>}>
      <div className="searxng-settings"><div className="sx-card sx-risk">
        <p>{t('proxyDialogHint')}</p>
        {approval?.step === 'notice' && <div className="sx-actions"><Button variant="outline" size="sm" disabled={locked} onClick={readStatement}>{t('proxyReadStatement')}</Button></div>}
        {approval?.step === 'statement' && <section aria-label={t('proxyStatementTitle')} className="sx-statement">
          <h3>{t('proxyStatementTitle')}</h3>
          <p>{t('proxyStatementRisk')}</p><p>{t('proxyStatementScope')}</p><p>{t('proxyStatementPrivacy')}</p>
          <p>{t('proxySession')}</p><p>{t('proxyStatementLimits')}</p>
          <p><a href={PROXY_RISK_URL} target="_blank" rel="noreferrer">{t('proxyDocs')}</a>{' · '}<a href={PROXY_RISK_URL_EN} target="_blank" rel="noreferrer">{t('proxyDocsEn')}</a></p>
        </section>}
        <label className="sx-check"><input type="checkbox" checked={ack} disabled={locked || approval?.step !== 'statement'} onChange={event => setAck(event.currentTarget.checked)} />{t('proxyAck')}</label>
        {approval?.step === 'notice' && <p className="sx-muted">{t('proxyReadFirst')}</p>}
      </div></div>
    </Modal>
  </section>
}
