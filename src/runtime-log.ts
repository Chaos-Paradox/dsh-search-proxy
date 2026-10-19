/** Redaction for operator logs; never records the subprocess environment. */
import { homedir } from 'node:os'

/** Remove owned paths, common credential syntax and known inherited secrets. */
export function redactRuntimeLog(text: string, directory: string, secrets: readonly string[] = []): string {
  let result = text
  if (directory) for (const path of [directory, directory.replaceAll('\\', '/'), JSON.stringify(directory).slice(1, -1)]) result = result.replaceAll(path, '<profile>/searxng')
  const inherited = Object.entries(process.env).filter(([key, value]) => /key|token|secret|password|authorization/i.test(key) && value && value.length >= 8).map(([, value]) => value!)
  for (const secret of [...secrets, ...inherited]) if (secret) {
    for (const form of [secret, encodeURIComponent(secret), JSON.stringify(secret).slice(1, -1)]) result = result.replaceAll(form, '[redacted]')
  }
  result = result.replace(/(https?:\/\/)[^\s/@]+:[^\s/@]*@/gi, '$1[redacted]@')
    .replace(/([?&](?:api[-_]?key|token|access_token|secret|password)=)[^&#\s]*/gi, '$1[redacted]')
    .replace(/((?:authorization|x-api-key|secret_key|password)\s*[:=]\s*)[^\r\n]+/gi, '$1[redacted]')
    .replace(/\bBearer\s+[^\s"']+/gi, 'Bearer [redacted]')
  for (const path of [homedir(), homedir().replaceAll('\\', '/'), JSON.stringify(homedir()).slice(1, -1)]) result = result.replaceAll(path, '~')
  return result
}
