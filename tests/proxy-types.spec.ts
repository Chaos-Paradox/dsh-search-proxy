import { expect, it } from 'vitest'
import { parseProxyResponse, PROXY_RISK_REVISION } from '../src/proxy-types.ts'

it('parses editable proxy defaults while discarding unrelated stored fields', () => {
  const configuration = { protocol: 'https', host: 'proxy.example', port: 443, noProxy: '.direct.example' }
  const status = { state: 'off', riskRevision: PROXY_RISK_REVISION, remembered: true }
  expect(parseProxyResponse({ ...status, configuration: { ...configuration, token: 'private-consent' }, revision: 'private-revision' }))
    .toEqual({ ...status, configuration })
  expect(parseProxyResponse(status)).toEqual(status)
  for (const invalid of [null, {}, { ...configuration, port: 0 }, { ...configuration, port: '443' }, { ...configuration, protocol: 'socks' }]) {
    expect(() => parseProxyResponse({ ...status, configuration: invalid })).toThrow('Invalid proxy configuration')
  }
})
