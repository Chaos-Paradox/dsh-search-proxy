import { expect, it, vi } from 'vitest'
import { homedir } from 'node:os'
import { redactRuntimeLog } from '../src/runtime-log.ts'

it('makes copied command/output logs omit known secrets, URL credentials and machine paths', () => {
  vi.stubEnv('SEARXNG_LOG_TEST_API_KEY', 'inherited-synthetic-secret')
  try {
    const directory = homedir() + '/profile/searxng'
    const text = directory + '/serve.py inherited-synthetic-secret local-synthetic-secret https://name:pass@example.test/?token=demo\nAuthorization: Bearer confidential\nsecret_key: generated-secret'
    const output = redactRuntimeLog(text, directory, ['local-synthetic-secret'])
    expect(output).toContain('<profile>/searxng/serve.py')
    for (const secret of [homedir(), 'inherited-synthetic-secret', 'local-synthetic-secret', 'name:pass', 'token=demo', 'confidential', 'generated-secret']) expect(output).not.toContain(secret)
  } finally { vi.unstubAllEnvs() }
})
