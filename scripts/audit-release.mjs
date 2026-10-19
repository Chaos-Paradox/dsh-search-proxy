/** Inspect the actual published archive; never print matching deployment values. */
import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as tar from 'tar'

export function releaseIssues(path, text) {
  const issues = []
  if (/(?:^|\/)(?:node_modules|tests?|artifacts|\.release-check)(?:\/|$)|(?:^|\/)\.env(?:\.|$)|credentials\.ya?ml$|validation-[^/]*\.(?:log|json)$/i.test(path)) issues.push('non-release file')
  if (/\/Users\/[^/\s]+\/|\/home\/[^/\s]+\/|[A-Z]:\\Users\\/i.test(text)) issues.push('development home path')
  if (/public-probe\.invalid|operator-proxy\.example|host-auth-test-secret|searxng-host-[a-z0-9]{6}/i.test(text)) issues.push('test fixture data')
  for (const match of text.matchAll(/(?:127\.0\.0\.1|localhost|\[::1\]):(\d{1,5})(?!\d)/g)) {
    // Existing SearXNG documentation uses conventional container examples, not observed endpoints.
    if (!/\.md$/i.test(path) || !['8080', '8088'].includes(match[1])) issues.push('fixed local endpoint')
  }
  return [...new Set(issues)]
}

export async function auditRelease(file) {
  const problems = [], paths = [], pending = []
  await tar.t({ file, onReadEntry(entry) {
    paths.push(entry.path)
    pending.push(new Promise((done, reject) => {
      const chunks = []; let size = 0
      entry.on('data', chunk => { size += chunk.length; if (size <= 20_000_000) chunks.push(chunk) })
      entry.on('error', reject)
      entry.on('end', () => {
        if (size > 20_000_000) problems.push(`${entry.path}: entry exceeds inspection limit`)
        else if (/\.(?:js|map|ts|json|ya?ml|md)$/i.test(entry.path) || /\.env/i.test(entry.path)) {
          for (const issue of releaseIssues(entry.path, Buffer.concat(chunks).toString('utf8'))) problems.push(`${entry.path}: ${issue}`)
        }
        done()
      })
    }))
    // Check forbidden paths even when a binary extension would bypass text inspection.
    for (const issue of releaseIssues(entry.path, '')) problems.push(`${entry.path}: ${issue}`)
  } })
  await Promise.all(pending)
  for (const required of ['docs/proxy-risk.md', 'docs/proxy-risk.zh.md', 'lib/index.js', 'lib/client.js']) {
    if (!paths.includes(`package/${required}`)) problems.push(`${required}: missing release file`)
  }
  if (problems.length) throw new Error([...new Set(problems)].join('\n'))
  return paths.length
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const directory = process.argv[2] ?? '.release-check'
  const files = directory.endsWith('.tgz') ? [directory] : (await readdir(directory)).filter(file => file.endsWith('.tgz')).map(file => resolve(directory, file))
  if (files.length !== 1) throw new Error('Provide one release archive or a directory containing exactly one archive')
  const count = await auditRelease(files[0])
  process.stdout.write(`Release privacy audit passed: ${count} entries; deployment values are not printed.\n`)
}
