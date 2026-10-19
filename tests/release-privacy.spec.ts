import { expect, it } from 'vitest'
// @ts-expect-error JavaScript release tooling intentionally ships no declarations.
import { releaseIssues } from '../scripts/audit-release.mjs'

it('rejects local runtime ports, developer paths, fixtures and accidental environment files without echoing values', () => {
  expect(releaseIssues('package/lib/client.js', 'http://localhost:1')).toContain('fixed local endpoint')
  expect(releaseIssues('package/lib/client.js.map', '/Users/example/private/file')).toContain('development home path')
  expect(releaseIssues('package/docs/proxy-risk.md', 'http://localhost:1')).toContain('fixed local endpoint')
  expect(releaseIssues('package/.env', '')).toContain('non-release file')
  expect(releaseIssues('package/tests/fixture.png', '')).toContain('non-release file')
  expect(releaseIssues('package/lib/index.js', 'public-probe.invalid')).toContain('test fixture data')
  expect(releaseIssues('package/lib/index.js', 'port: configuration.port')).toEqual([])
})
