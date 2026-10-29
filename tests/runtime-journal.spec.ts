import { afterEach, expect, it, vi } from 'vitest'
import { appendFile, link, mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { RuntimeJournal, RUNTIME_LOG_FILE_BYTES, RUNTIME_LOG_MAX_BYTES } from '../src/runtime-journal.ts'
import type { RuntimeActivity } from '../src/runtime-types.ts'

const directories: string[] = [], journals: RuntimeJournal[] = []
afterEach(async () => {
  await Promise.all(journals.splice(0).map(journal => journal.flush()))
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true })
  vi.unstubAllEnvs()
})
async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'searxng-log-test-'))
  directories.push(directory)
  return directory
}
function journal(directory: string) { const value = new RuntimeJournal(directory); journals.push(value); return value }
function event(detail: string): RuntimeActivity { return { time: '2026-10-29T10:00:00.000Z', kind: 'error', subject: 'SearXNG', detail } }

it('retains redacted summaries across instances, with private file permissions and isolated profiles', async () => {
  vi.stubEnv('SEARXNG_LOG_TEST_API_KEY', 'inherited-journal-test-secret')
  const directory = await fixture(), first = journal(directory)
  first.record(event(`${directory}/serve.py ${homedir()}/private inherited-journal-test-secret https://user:pass@example.test/?token=private\nAuthorization: Bearer sensitive-value`))
  await first.flush()
  const file = join(directory, 'logs/runtime.jsonl'), text = await readFile(file, 'utf8')
  for (const secret of [directory, homedir(), 'inherited-journal-test-secret', 'user:pass', 'token=private', 'sensitive-value']) expect(text).not.toContain(secret)
  expect(text).toContain('[redacted]')
  if (process.platform !== 'win32') expect((await stat(file)).mode & 0o777).toBe(0o600)
  const restored = journal(directory)
  await restored.flush()
  expect(restored.activities()).toEqual(first.activities())
  restored.activities()[0]!.detail = 'changed-by-caller'
  expect(restored.activities()[0]!.detail).not.toBe('changed-by-caller')
  const other = journal(await fixture())
  await other.flush()
  expect(other.activities()).toEqual([])
  expect(restored.storage()).toMatchObject({ failed: false, maxBytes: 256 * 1024 })
})

it('rotates two bounded files using UTF-8 byte sizes and shows at most 100 recent events', async () => {
  const directory = await fixture(), value = journal(directory)
  for (let batch = 0; batch < 6; batch++) {
    for (let index = 0; index < 20; index++) value.record(event(`record-${batch}-${index} ${'网络'.repeat(700)}`))
    await value.flush()
  }
  const files = await readdir(join(directory, 'logs'))
  expect(files.sort()).toEqual(['runtime.1.jsonl', 'runtime.jsonl'])
  let total = 0
  for (const file of files) {
    const size = (await stat(join(directory, 'logs', file))).size
    expect(size).toBeLessThanOrEqual(RUNTIME_LOG_FILE_BYTES)
    total += size
  }
  expect(total).toBeLessThanOrEqual(RUNTIME_LOG_MAX_BYTES)
  expect(value.storage()).toEqual({ bytes: total, maxBytes: RUNTIME_LOG_MAX_BYTES, failed: false })
  expect(value.activities()).toHaveLength(100)
  const restored = journal(directory)
  await restored.flush()
  expect(restored.activities().at(-1)?.detail).toContain('record-5-19')
  expect(JSON.stringify(restored.activities())).not.toContain('record-0-0 ')
})

it('clears both generations in order, preserves unrelated files and accepts later records', async () => {
  const directory = await fixture(), value = journal(directory)
  value.record(event('before-clear'))
  await value.flush()
  await writeFile(join(directory, 'logs/unrelated.txt'), 'retain')
  await writeFile(join(directory, 'secret'), 'synthetic secret')
  await writeFile(join(directory, 'logs/runtime.1.jsonl'), JSON.stringify(event('older-generation')) + '\n')
  const clearing = value.clear()
  value.record(event('after-clear'))
  await clearing
  await value.flush()
  expect(value.activities().map(event => event.detail)).toEqual(['after-clear'])
  expect(await readFile(join(directory, 'logs/unrelated.txt'), 'utf8')).toBe('retain')
  expect(await readFile(join(directory, 'secret'), 'utf8')).toBe('synthetic secret')
  await expect(stat(join(directory, 'logs/runtime.1.jsonl'))).rejects.toMatchObject({ code: 'ENOENT' })
  const restored = journal(directory)
  await restored.flush()
  expect(restored.activities().map(event => event.detail)).toEqual(['after-clear'])
  await restored.clear()
  expect(restored.storage().bytes).toBe(0)
})

it('recovers past malformed and partial records without losing the next append', async () => {
  const directory = await fixture(), value = journal(directory)
  value.record(event('first'))
  await value.flush()
  await appendFile(join(directory, 'logs/runtime.jsonl'), 'not-json\n{"kind":"unknown"}\n{"partial":')
  const restored = journal(directory)
  await restored.flush()
  expect(restored.activities().map(event => event.detail)).toEqual(['first'])
  restored.record(event('after-partial'))
  await restored.flush()
  const next = journal(directory)
  await next.flush()
  expect(next.activities().map(event => event.detail)).toEqual(['first', 'after-partial'])
})

it.each(['runtime.jsonl', 'runtime.1.jsonl'])('repairs oversized %s before appending and restores healthy storage', async name => {
  const directory = await fixture()
  await mkdir(join(directory, 'logs'))
  const oversized = join(directory, 'logs', name)
  await writeFile(oversized, 'x'.repeat(RUNTIME_LOG_MAX_BYTES + 1))
  const value = journal(directory)
  await value.flush()
  expect(value.storage()).toEqual({ bytes: 0, maxBytes: RUNTIME_LOG_MAX_BYTES, failed: false })
  expect((await stat(oversized)).size).toBe(0)
  value.record(event('recovered'))
  await value.flush()
  expect((await stat(join(directory, 'logs/runtime.jsonl'))).size).toBeLessThan(RUNTIME_LOG_FILE_BYTES)
  expect(value.storage().failed).toBe(false)
  const restored = journal(directory)
  await restored.flush()
  expect(restored.activities().at(-1)?.detail).toBe('recovered')
})

it('keeps bounded in-memory records on disk failure and refuses redirected log directories or files', async () => {
  const directory = await fixture(), target = await fixture()
  await writeFile(join(target, 'untouched'), 'retain')
  await symlink(target, join(directory, 'logs'), process.platform === 'win32' ? 'junction' : 'dir')
  const redirected = journal(directory)
  redirected.record(event('still viewable'))
  await redirected.flush()
  expect(redirected.storage().failed).toBe(true)
  await expect(redirected.clear()).rejects.toThrow('Could not clear saved runtime records')
  expect(await readdir(target)).toEqual(['untouched'])

  const directory2 = await fixture()
  await mkdir(join(directory2, 'logs'))
  await link(join(target, 'untouched'), join(directory2, 'logs/runtime.jsonl'))
  const linked = journal(directory2)
  for (let index = 0; index < 500; index++) linked.record(event(`memory-${index}`))
  await linked.flush()
  expect(linked.storage().failed).toBe(true)
  expect(linked.activities()).toHaveLength(100)
  expect(linked.activities().at(-1)?.detail).toBe('memory-499')
  expect(await readFile(join(target, 'untouched'), 'utf8')).toBe('retain')
})
