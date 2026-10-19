/** Pinned, verified bootstrap downloads; setup never changes system Python or PATH. */
import { createHash } from 'node:crypto'
import { access, chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { x } from 'tar'
import { unzipSync } from 'fflate'
import type { RuntimeActivity, RuntimeSetupInfo } from './runtime-types.ts'

export const UV_VERSION = '0.13.0'
export const SEARXNG_REVISION = 'f4822b3fc46726bb259d14c6332b702c76b98f82'
export const PYTHON_VERSION = '3.12.12'
const WINDOWS_COMPATIBILITY_VERSION = 1
const SOURCE_SHA256 = 'a377e229d3f05bba445894f83c0d450093174201c416441b565c772787f85ffd'
export const WAITRESS_VERSION = '3.0.2'
const UV_ASSETS: Record<string, { name: string; hash: string }> = {
  'darwin-arm64': { name: 'uv-aarch64-apple-darwin.tar.gz', hash: 'a9c1b29002cf3c83f07fa9cd8a887a3be0107d90e23189721221e7257db8e3d6' },
  'darwin-x64': { name: 'uv-x86_64-apple-darwin.tar.gz', hash: '5f44dcbde809b632f47c36fadb241cb4d6f9af71d0c8f172b5d2026d3dde742c' },
  'linux-arm64': { name: 'uv-aarch64-unknown-linux-gnu.tar.gz', hash: '3ccfb6af6e242433eb552f7d9676abd5412c6595c497e990d9c8cb7b5bd4d2c3' },
  'linux-x64': { name: 'uv-x86_64-unknown-linux-gnu.tar.gz', hash: '1468ebd5a5541121837c5a2817b9972ba6090fa6caa3d142620850a47fb75154' },
  'win32-arm64': { name: 'uv-aarch64-pc-windows-msvc.zip', hash: 'cb54028b59aa87f11cf6dec293ce000420043a49a8aea522e822a671321f8932' },
  'win32-x64': { name: 'uv-x86_64-pc-windows-msvc.zip', hash: '088962f9e7b7bd9ea740c04c650b2a21c8928c345bd99ac24350dc924dba656c' },
}

/** Commands execute as argv through DSH's managed subprocess capability. */
export type RuntimeCommand = (argv: string[], cwd: string, env: Record<string, string>, signal: AbortSignal) => Promise<void>
export interface PreparedRuntime { python: string; source: string }
export type RuntimeRecorder = (event: Omit<RuntimeActivity, 'time'>) => void

/** A missing cache cannot authorize a download, including after a cache race. */
export class RuntimeSetupRequired extends Error {
  constructor() { super('Review the first-use summary and choose Prepare and start') }
}

function runtimePaths(directory: string) {
  const base = join(directory, `runtime-${SEARXNG_REVISION.slice(0, 12)}-${UV_VERSION}-${PYTHON_VERSION}`)
  return { base, source: join(base, 'source'), python: join(base, 'venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'), marker: join(base, 'ready.json') }
}

async function cachedRuntime(directory: string): Promise<PreparedRuntime | undefined> {
  const { source, python, marker } = runtimePaths(directory)
  try {
    const ready = JSON.parse(await readFile(marker, 'utf8'))
    if (ready.revision !== SEARXNG_REVISION || ready.python !== PYTHON_VERSION || ready.uv !== UV_VERSION
      || ready.compatibility !== WINDOWS_COMPATIBILITY_VERSION) return undefined
    await access(join(source, 'searx', 'webapp.py'))
    await access(python)
    return { python, source }
  } catch { return undefined /* Missing or partial cache requires explicit first-use approval. */ }
}

/** Read only; does not create directories, run commands or use the network. */
export async function runtimeIsPrepared(directory: string): Promise<boolean> {
  return !!await cachedRuntime(directory)
}

/** Actual pinned components and their distinct verification mechanisms. */
export function runtimeSetupInfo(directory: string, cached: boolean): RuntimeSetupInfo {
  const asset = UV_ASSETS[`${process.platform}-${process.arch}`]
  return { directory, cached, components: [
    { name: 'uv', version: UV_VERSION, source: asset ? `https://github.com/astral-sh/uv/releases/download/${UV_VERSION}/${asset.name}` : `${process.platform}/${process.arch}`, verification: 'sha256' },
    { name: 'Python', version: PYTHON_VERSION, source: 'uv / python-build-standalone', verification: 'tool-managed' },
    { name: 'SearXNG', version: SEARXNG_REVISION, source: `https://codeload.github.com/searxng/searxng/tar.gz/${SEARXNG_REVISION}`, verification: 'sha256' },
    { name: `Python dependencies + Waitress ${WAITRESS_VERSION}`, version: 'source/requirements.txt', source: 'PyPI', verification: 'package-index' },
  ] }
}

/** Resolve a supported uv binary without shell commands or OS path assumptions. */
export function uvAsset(platform: string, arch: string) {
  const asset = UV_ASSETS[`${platform}-${arch}`]
  if (!asset) throw new Error(`Automatic setup is unavailable on ${platform}/${arch}; use an external instance`)
  return asset
}

/** Download with cancellation, bounded size, and a pinned SHA-256 before extraction. */
export async function verifiedDownload(url: string, hash: string, target: string, signal: AbortSignal): Promise<void> {
  const response = await fetch(url, { signal })
  if (!response.ok || !response.body) throw new Error(`Runtime download failed: HTTP ${response.status}`)
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of response.body) {
    size += chunk.byteLength
    if (size > 128 * 1024 * 1024) throw new Error('Runtime archive exceeds size limit')
    chunks.push(chunk)
  }
  const data = Buffer.concat(chunks)
  if (createHash('sha256').update(data).digest('hex') !== hash) throw new Error('Runtime archive checksum mismatch')
  signal.throwIfAborted()
  await writeFile(target, data)
}

/** Extract a pinned archive into a private staging directory; links are excluded. */
export async function extractRuntimeArchive(archive: string, destination: string, uvOnly = false): Promise<void> {
  await mkdir(destination, { recursive: true })
  if (archive.endsWith('.zip')) {
    const entries = unzipSync(await readFile(archive), { filter: file => file.name === 'uv.exe' || file.name.endsWith('/uv.exe') })
    const binary = Object.values(entries)
    if (binary.length !== 1) throw new Error('uv archive contains no unique executable')
    await writeFile(join(destination, 'uv.exe'), binary[0]!)
    return
  }
  await x({ file: archive, cwd: destination, strip: 1, strict: true, preservePaths: false,
    filter: (path, entry) => ('type' in entry ? entry.type !== 'SymbolicLink' && entry.type !== 'Link' : !entry.isSymbolicLink())
      && (!uvOnly || path.endsWith('/uv')) })
  if (uvOnly) await chmod(join(destination, 'uv'), 0o700)
}

/** The pinned Valkey client imports Unix account metadata even with Valkey disabled.
 * Preserve its POSIX behavior and use an account-independent error log on Windows.
 */
export async function applyWindowsCompatibility(source: string, platform: string = process.platform): Promise<void> {
  if (platform !== 'win32') return
  const target = join(source, 'searx', 'valkeydb.py')
  const original = await readFile(target, 'utf8')
  const accountLog = "        _pw = pwd.getpwuid(os.getuid())\n        logger.exception(\"[%s (%s)] can't connect valkey DB ...\", _pw.pw_name, _pw.pw_uid)"
  if (!original.includes('\nimport pwd\n') || !original.includes(accountLog)) throw new Error('Pinned SearXNG Windows compatibility patch no longer matches')
  const patched = original.replace('\nimport pwd\n', '\ntry:\n    import pwd\nexcept ImportError:\n    pwd = None\n')
    .replace(accountLog, "        if pwd is None:\n            logger.exception(\"can't connect valkey DB ...\")\n        else:\n            _pw = pwd.getpwuid(os.getuid())\n            logger.exception(\"[%s (%s)] can't connect valkey DB ...\", _pw.pw_name, _pw.pw_uid)")
  await writeFile(target, patched)
}

/** Prepare a versioned, profile-owned runtime. Failed setup is retried without a ready marker. */
export async function prepareRuntime(
  directory: string, command: RuntimeCommand, signal: AbortSignal, progress: (message: string) => void,
  record: RuntimeRecorder = () => {}, allowSetup = false,
): Promise<PreparedRuntime> {
  const asset = uvAsset(process.platform, process.arch)
  const { base, source, python, marker } = runtimePaths(directory)
  const cached = await cachedRuntime(directory)
  if (cached) { record({ kind: 'cache', subject: 'SearXNG', detail: base }); return cached }
  if (!allowSetup) throw new RuntimeSetupRequired()
  await mkdir(base, { recursive: true, mode: 0o700 })
  const uvArchive = join(base, asset.name)
  progress('uv')
  const uvURL = `https://github.com/astral-sh/uv/releases/download/${UV_VERSION}/${asset.name}`
  record({ kind: 'download', subject: `uv ${UV_VERSION}`, detail: uvURL })
  await verifiedDownload(uvURL, asset.hash, uvArchive, signal)
  record({ kind: 'verify', subject: `uv ${UV_VERSION}`, detail: `SHA-256 ${asset.hash}` })
  await extractRuntimeArchive(uvArchive, join(base, 'bootstrap'), true)
  record({ kind: 'extract', subject: 'uv', detail: join(base, 'bootstrap') })
  const uv = join(base, 'bootstrap', process.platform === 'win32' ? 'uv.exe' : 'uv')
  progress('source')
  const sourceArchive = join(base, 'source.tar.gz')
  const sourceURL = `https://codeload.github.com/searxng/searxng/tar.gz/${SEARXNG_REVISION}`
  record({ kind: 'download', subject: 'SearXNG', detail: sourceURL })
  await verifiedDownload(sourceURL, SOURCE_SHA256, sourceArchive, signal)
  record({ kind: 'verify', subject: 'SearXNG', detail: `SHA-256 ${SOURCE_SHA256}` })
  await rm(source, { recursive: true, force: true })
  await extractRuntimeArchive(sourceArchive, source)
  record({ kind: 'extract', subject: 'SearXNG', detail: source })
  await applyWindowsCompatibility(source)
  if (process.platform === 'win32') record({ kind: 'configure', subject: 'Windows / Valkey', detail: 'Optional Unix account import and account-independent error logging' })
  const env = {
    UV_PYTHON_INSTALL_DIR: join(directory, 'python'), UV_CACHE_DIR: join(directory, 'uv-cache'),
    UV_PYTHON_INSTALL_BIN: '0', UV_NO_PROGRESS: '1', UV_PYTHON_PREFERENCE: 'only-managed',
    UV_PYTHON_DOWNLOADS: 'automatic', UV_NO_CONFIG: '1',
  }
  progress('python')
  await command([uv, 'venv', '--python', PYTHON_VERSION, '--clear', join(base, 'venv')], base, env, signal)
  progress('dependencies')
  await command([uv, 'pip', 'install', '--python', python, '-r', join(source, 'requirements.txt'), `waitress==${WAITRESS_VERSION}`], source, env, signal)
  await command([python, '-c', 'import flask, curl_cffi, lxml, waitress'], source, env, signal)
  await writeFile(`${marker}.tmp`, JSON.stringify({ revision: SEARXNG_REVISION, python: PYTHON_VERSION, uv: UV_VERSION, compatibility: WINDOWS_COMPATIBILITY_VERSION }))
  await rename(`${marker}.tmp`, marker)
  await rm(uvArchive, { force: true })
  await rm(sourceArchive, { force: true })
  return { python, source }
}
