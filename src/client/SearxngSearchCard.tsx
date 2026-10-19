/** SearXNG settings and the staged opt-in official fallback checkbox. */

import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { Button, SettingsForm, SettingsSecretField, SettingsValueField } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { useState } from 'react'
import { formLabels } from './locales.ts'
import { EngineChoiceField, LanguageChoiceField } from './SearchChoiceFields.tsx'
import type { SearxngSearchCardFace } from './searxng-search-card-controller.ts'
import { checkLatestRelease, CURRENT_VERSION, RELEASES_URL, type UpdateCheck } from './update-check.ts'
import { ServicePanel } from './ServicePanel.tsx'
import { ProxyPanel } from './ProxyPanel.tsx'
import { settingsStyles } from './settings-styles.ts'

/** Props the renderer binds for the SearXNG search page. */
export type SearxngSearchCardProps =
  PropsRuntime<'plugins.item'>
  & PropsLocale<'settings.webSearchSearxng'>
  & InjectFace<SearxngSearchCardFace>

/**
 * Render the SearXNG search provider's one-liner or its settings form, as the Plugins page asks.
 * The fallback checkbox is staged with the other fields and takes effect on save.
 * Update checks run only on click.
 * @param props - the view asked for, locale copy, the form snapshot, and its actions.
 * @returns the one-liner, or the form.
 */
export function SearxngSearchCard(props: SearxngSearchCardProps) {
  const { t } = props
  const state = props.useSearxngSearchCard(snapshot => snapshot)
  const [update, setUpdate] = useState<{ checking: boolean; result?: UpdateCheck }>({ checking: false })
  if (props.view === 'summary') return t('description')
  const fallbackAllowed = state.allowOfficialApiFallback.text === 'true'
  const disabled = !state.available || !state.writable || state.saving
  const fields = [state.mode, state.managedPort, state.baseURL, state.engines, state.language, state.authEnabled, state.authHeaderName, state.allowOfficialFallback, state.allowOfficialApiFallback, state.allowOfficialFetchFallback]
  const local = state.mode.text === 'local' || state.mode.text === 'auto' && !state.baseURL.text.trim() && !state.authEndpoint
  const anyOverridden = fields.some(field => field.overridden)
  // Stages defaults for every field; the user reviews and saves through the
  // form's own save button, exactly like the per-field reset buttons.
  const resetAll = (): void => {
    props.resetField('mode')
    props.resetField('managedPort')
    props.resetField('baseURL')
    props.resetField('engines')
    props.resetField('language')
    props.resetField('authEnabled')
    props.resetField('authHeaderName')
    props.edit('authHeaderValue', '')
    props.resetField('allowOfficialFallback')
    props.resetField('allowOfficialApiFallback')
    props.resetField('allowOfficialFetchFallback')
  }
  return (
    <div className="searxng-settings">
      <style>{settingsStyles}</style>
      <ServicePanel call={props.serviceCall} restoreRoutesCall={props.restoreRoutesCall} draft={state.dirty || state.saving || state.authBusy} t={t} writable={state.available && state.writable} />
      <SettingsForm labels={formLabels(t)} state={state} onSave={props.save} onDiscard={props.discard}>
        <section className="sx-card" aria-label={t('connectionTitle')}>
        <h3>{t('connectionTitle')}</h3>
        <div className="sx-field">
        <label htmlFor="searxng-mode">{t('modeLabel')}</label>
        <select id="searxng-mode" value={state.mode.text} disabled={disabled} onChange={e => props.edit('mode', e.currentTarget.value)}>
          <option value="auto">{t('modeAuto')}</option><option value="local">{t('modeLocal')}</option><option value="external">{t('modeExternal')}</option>
        </select>
        <p className="sx-muted">{t('modeHint')}</p>
        </div>
        {!local && <SettingsValueField
          id="plugin-config-web-search-searxng-endpoint"
          label={t('baseUrl')}
          hint={t('baseUrlHint')}
          overriddenLabel={t('overridden')}
          resetLabel={t('reset')}
          invalidLabel={t('invalidValue')}
          disabled={disabled}
          {...state.baseURL}
          onEdit={text => props.edit('baseURL', text)}
          onReset={() => props.resetField('baseURL')}
        />}
        <p className="sx-muted">{t('authDefaultHint')}</p>
        {!local && <details open={state.authEnabled.text === 'true' || undefined}>
          <summary>{t('authTitle')}</summary>
          <fieldset className="sx-plain-fieldset" disabled={disabled || state.authBusy}>
          <label className="sx-check">
            <input type="checkbox" checked={state.authEnabled.text === 'true'}
              onChange={event => props.edit('authEnabled', String(event.currentTarget.checked))}
              aria-describedby="searxng-auth-hint" />
            {t('authEnabled')}
          </label>
          <p className="sx-muted" id="searxng-auth-hint">{t('authHint')}</p>
          {state.authEnabled.text === 'true' && <>
            <SettingsValueField id="searxng-auth-header-name" label={t('authHeaderName')} hint={t('authHeaderNameHint')}
              overriddenLabel={t('overridden')} resetLabel={t('reset')} invalidLabel={t('authHeaderInvalid')}
              disabled={disabled} {...state.authHeaderName}
              onEdit={text => props.edit('authHeaderName', text)} onReset={() => props.resetField('authHeaderName')} />
            <SettingsSecretField id="searxng-auth-header-value" label={t('authHeaderValue')} hint={t('authHeaderValueHint')}
              text={state.authHeaderValue.text} configured={state.authConfigured}
              stateLabel={t(state.authConfigured ? 'authConfigured' : 'authNotConfigured')}
              disabled={disabled || !state.authWritable} onEdit={text => props.edit('authHeaderValue', text)} />
            {!state.authWritable && <p>{t('authUnavailable')}</p>}
            <Button variant="outline" size="sm" disabled={disabled || state.dirty || !state.authWritable || !state.authConfigured}
              onClick={props.clearAuth}>{t('authClear')}</Button>
            {state.authFailed && <p role="alert">{t('authClearFailed')}</p>}
          </>}
        </fieldset></details>}
        </section>
        <section className="sx-card" aria-label={t('preferencesTitle')}>
        <h3>{t('preferencesTitle')}</h3>
        <LanguageChoiceField t={t} state={state.language} disabled={disabled}
          onEdit={text => props.edit('language', text)} onReset={() => props.resetField('language')} />
        <EngineChoiceField t={t} state={state.engines} disabled={disabled}
          onEdit={text => props.edit('engines', text)} onReset={() => props.resetField('engines')} />
        </section>
        <section className="sx-card" aria-label={t('optionsTitle')}>
        <h3>{t('optionsTitle')}</h3>
        <label className="sx-check">
          <input type="checkbox" checked={fallbackAllowed} disabled={disabled}
            onChange={event => props.edit('allowOfficialApiFallback', String(event.currentTarget.checked))}
            aria-describedby="searxng-fallback-hint" />
          {t('fallbackLabel')}
        </label>
        <label className="sx-check">
          <input type="checkbox" checked={state.allowOfficialFetchFallback.text === 'true'} disabled={disabled}
            onChange={event => props.edit('allowOfficialFetchFallback', String(event.currentTarget.checked))}
            aria-describedby="searxng-fetch-fallback-hint" />
          {t('fetchFallbackLabel')}
        </label>
        <p className="sx-muted" id="searxng-fetch-fallback-hint">{t('fetchFallbackHint')}</p>
        <details><summary>{t('serviceBehavior')}</summary>
          <p className="sx-muted" id="searxng-fallback-hint">{t('fallbackHint')}</p><p className="sx-muted">{t('routeHint')}</p>
        </details>
        {local && <details><summary>{t('advanced')}</summary>
          <SettingsValueField id="searxng-managed-port" label={t('managedPort')} hint={t('managedPortHint')}
            overriddenLabel={t('overridden')} resetLabel={t('reset')} invalidLabel={t('invalidValue')} disabled={disabled}
            {...state.managedPort} onEdit={text => props.edit('managedPort', text)} onReset={() => props.resetField('managedPort')} />
        </details>}
        <Button variant="outline" size="sm" disabled={disabled || !anyOverridden} onClick={resetAll}>
          {t('resetAll')}
        </Button>
        </section>
      </SettingsForm>
      <div className="sx-version">
        <span>{t('currentVersion')}: v{CURRENT_VERSION}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={update.checking}
          onClick={() => {
            setUpdate({ checking: true })
            void checkLatestRelease().then(result => setUpdate({ checking: false, result }))
          }}
        >
          {update.checking ? t('checkingUpdate') : t('checkUpdate')}
        </Button>
        {update.result?.kind === 'newer' && (
          <span>
            {t('updateAvailable')} v{update.result.latest}
            {' · '}
            <a href={RELEASES_URL} target="_blank" rel="noreferrer">{t('updateReleases')}</a>
            {' · '}
            {t('updateHowTo')}
          </span>
        )}
        {update.result?.kind === 'latest' && <span>{t('updateLatest')}</span>}
        {update.result?.kind === 'unknown' && <span>{t('updateFailed')}</span>}
      </div>
      <ProxyPanel call={props.proxyCall} t={t} writable={state.available && state.writable} />
    </div>
  )
}
