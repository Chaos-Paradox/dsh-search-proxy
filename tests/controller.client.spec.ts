import { describe, expect, it, vi } from 'vitest'
import type { SettingsPathOpView } from '@deepseek-ai/dsh-api-remotes/client'
import { stubConfigForm, type StubConfigForm } from './helpers.ts'
import { SearxngSearchCardController, type SearxngSearchSettings } from '../src/client/searxng-search-card-controller.ts'
import type { InstanceAuthTarget } from '../src/auth-types.ts'

/** Make the stub behave like a Host that accepts every write. */
function acceptWrites<T>(host: StubConfigForm<T>): void {
  const section = (): Record<string, unknown> => ({ ...host.scope.getSnapshot().value as object })
  const layer = (): Record<string, unknown> => ({ ...host.scope.getSnapshot().user as object })
  host.set.mockImplementation((field: string, value: unknown) => {
    host.publish({ value: { ...section(), [field]: value } as T, user: { ...layer(), [field]: value } })
  })
  host.mutate.mockImplementation((ops: readonly SettingsPathOpView[]) => {
    const value = { ...section() }
    const user = { ...layer() }
    for (const op of ops) {
      const field = op.path[0]!
      if (op.op === 'set') {
        value[field] = op.value
        user[field] = op.value
      } else {
        Reflect.deleteProperty(user, field)
        value[field] = (host.scope.getSnapshot().base as Record<string, unknown> | undefined)?.[field]
      }
    }
    host.publish({ value: value as T, user })
    return Promise.resolve(true)
  })
  host.unset.mockImplementation((field: string) => {
    const user = Object.fromEntries(Object.entries(layer()).filter(([key]) => key !== field))
    const base = host.scope.getSnapshot().base as Record<string, unknown> | undefined
    host.publish({ value: { ...section(), [field]: base?.[field] } as T, user })
  })
}

describe('SearxngSearchCardController', () => {
  it('projects the served section into field state', () => {
    const host = stubConfigForm<SearxngSearchSettings>()
    const controller = new SearxngSearchCardController(host.scope)
    host.publish({ status: 'ready', writable: true, value: { baseURL: 'http://localhost:8080' }, user: {} })

    const state = controller.inject().hooks.searxngSearchCard.getSnapshot()
    expect(state).toMatchObject({
      available: true,
      baseURL: { text: 'http://localhost:8080', overridden: false },
      engines: { text: '', overridden: false },
      language: { text: '', overridden: false },
    })
  })

  it('saves the endpoint, engines, and language together', async () => {
    const host = stubConfigForm<SearxngSearchSettings>()
    acceptWrites(host)
    const controller = new SearxngSearchCardController(host.scope)
    host.publish({ status: 'ready', writable: true, value: {}, base: {}, user: {} })
    const face = controller.inject()

    face.edit('baseURL', 'http://searxng.internal')
    face.edit('engines', 'bing,duckduckgo')
    face.edit('language', 'zh-CN')
    expect(face.hooks.searxngSearchCard.getSnapshot().dirty).toBe(true)
    face.save()
    await vi.waitFor(() => { expect(host.mutate).toHaveBeenCalledTimes(1) })

    expect(host.mutate.mock.calls.map(([ops]) => ops)).toEqual([
      [['baseURL', 'http://searxng.internal'], ['engines', 'bing,duckduckgo'], ['language', 'zh-CN']]
        .map(([field, value]) => ({ op: 'set', path: [field], value })),
    ])
  })

  it('stages a reset back to the composition layer', async () => {
    const host = stubConfigForm<SearxngSearchSettings>()
    acceptWrites(host)
    const controller = new SearxngSearchCardController(host.scope)
    host.publish({
      status: 'ready', writable: true,
      value: { engines: 'bing' }, base: {}, user: { engines: 'bing' },
    })
    const face = controller.inject()

    face.resetField('engines')
    face.save()
    await vi.waitFor(() => { expect(host.mutate).toHaveBeenCalledTimes(1) })

    expect(host.mutate.mock.calls.map(([ops]) => ops)).toEqual([[{ op: 'unset', path: ['engines'] }]])
    await vi.waitFor(() => {
      expect(face.hooks.searxngSearchCard.getSnapshot().engines).toMatchObject({ text: '', overridden: false })
    })
  })

  it('writes explicit booleans so inherited true can be disabled', async () => {
    const host = stubConfigForm<SearxngSearchSettings>()
    acceptWrites(host)
    const controller = new SearxngSearchCardController(host.scope)
    host.publish({ status: 'ready', writable: true, value: {}, base: {}, user: {} })
    const face = controller.inject()

    expect(face.hooks.searxngSearchCard.getSnapshot().allowOfficialFallback.text).toBe('false')
    face.edit('allowOfficialFallback', 'true')
    face.save()
    await vi.waitFor(() => { expect(host.mutate).toHaveBeenCalledTimes(1) })
    expect(host.mutate.mock.calls.map(([ops]) => ops)).toEqual([[{ op: 'set', path: ['allowOfficialFallback'], value: true }]])
    await vi.waitFor(() => {
      expect(face.hooks.searxngSearchCard.getSnapshot().allowOfficialFallback).toMatchObject({ text: 'true', overridden: true })
    })

    host.publish({ status: 'ready', writable: true, value: { allowOfficialFallback: true }, base: { allowOfficialFallback: true }, user: {} })
    face.edit('allowOfficialFallback', 'false')
    face.save()
    await vi.waitFor(() => { expect(host.mutate).toHaveBeenCalledTimes(2) })
    expect(host.mutate.mock.calls.map(([ops]) => ops)[1]).toEqual([{ op: 'set', path: ['allowOfficialFallback'], value: false }])
    await vi.waitFor(() => {
      expect(face.hooks.searxngSearchCard.getSnapshot().allowOfficialFallback).toMatchObject({ text: 'false', overridden: true })
    })
  })

  it('saves authentication settings together and writes the secret separately without readback', async () => {
    const host = stubConfigForm<SearxngSearchSettings>(); acceptWrites(host)
    let configured = false
    const auth = {
      describe: vi.fn(async (target: InstanceAuthTarget) => ({ endpoint: target.baseURL, configured, writable: true })),
      set: vi.fn(async (target: InstanceAuthTarget, _value: string) => { configured = true; return { endpoint: target.baseURL, configured, writable: true } }),
      clear: vi.fn(async (target: InstanceAuthTarget) => { configured = false; return { endpoint: target.baseURL, configured, writable: true } }),
    }
    const controller = new SearxngSearchCardController(host.scope, auth)
    host.publish({ status: 'ready', writable: true, value: {}, base: {}, user: {} })
    const face = controller.inject()
    face.edit('baseURL', 'https://search.test')
    face.edit('authEnabled', 'true')
    face.edit('authHeaderName', 'Authorization')
    face.edit('authHeaderValue', 'Bearer example-secret')
    face.save()
    await vi.waitFor(() => expect(face.hooks.searxngSearchCard.getSnapshot()).toMatchObject({ dirty: false, authConfigured: true, authHeaderValue: { text: '' } }))
    expect(host.mutate.mock.calls[0]?.[0]).toEqual([
      { op: 'set', path: ['baseURL'], value: 'https://search.test' },
      { op: 'set', path: ['authEnabled'], value: true },
      { op: 'set', path: ['authHeaderName'], value: 'Authorization' },
    ])
    expect(JSON.stringify(host.mutate.mock.calls)).not.toContain('example-secret')
    expect(auth.set).toHaveBeenCalledWith({ baseURL: 'https://search.test', headerName: 'Authorization' }, 'Bearer example-secret')
    face.edit('authHeaderValue', '')
    face.edit('language', 'en'); face.save()
    await vi.waitFor(() => expect(host.mutate).toHaveBeenCalledTimes(2))
    expect(auth.set).toHaveBeenCalledOnce()
    await vi.waitFor(() => expect(face.hooks.searxngSearchCard.getSnapshot().dirty).toBe(false))
    face.clearAuth()
    await vi.waitFor(() => expect(face.hooks.searxngSearchCard.getSnapshot().authConfigured).toBe(false))
    expect(auth.clear).toHaveBeenCalledOnce()
    controller.dispose()
  })

  it('rejects an invalid header draft without saving any settings or secret', () => {
    const host = stubConfigForm<SearxngSearchSettings>(); acceptWrites(host)
    const controller = new SearxngSearchCardController(host.scope)
    host.publish({ status: 'ready', writable: true, value: {}, base: {}, user: {} })
    const face = controller.inject(); face.edit('authHeaderName', 'Host'); face.save()
    expect(face.hooks.searxngSearchCard.getSnapshot()).toMatchObject({ invalid: true })
    expect(host.mutate).not.toHaveBeenCalled()
    controller.dispose()
  })

  it('drops a late credential status from a previously selected endpoint', async () => {
    const host = stubConfigForm<SearxngSearchSettings>()
    let finishOld!: (status: { endpoint: string; configured: boolean; writable: boolean }) => void
    const auth = {
      describe: vi.fn((target: InstanceAuthTarget) => target.baseURL === 'https://old.test'
        ? new Promise<{ endpoint: string; configured: boolean; writable: boolean }>(resolve => { finishOld = resolve })
        : Promise.resolve({ endpoint: target.baseURL, configured: false, writable: true })),
      set: vi.fn(), clear: vi.fn(),
    }
    const controller = new SearxngSearchCardController(host.scope, auth)
    host.publish({ status: 'ready', writable: true, value: { baseURL: 'https://old.test' }, user: {} })
    const face = controller.inject(); face.edit('baseURL', 'https://new.test')
    await vi.waitFor(() => expect(face.hooks.searxngSearchCard.getSnapshot().authEndpoint).toBe('https://new.test'))
    finishOld({ endpoint: 'https://old.test', configured: true, writable: true })
    await Promise.resolve()
    expect(face.hooks.searxngSearchCard.getSnapshot()).toMatchObject({ authEndpoint: 'https://new.test', authConfigured: false })
    face.discard()
    finishOld({ endpoint: 'https://old.test', configured: true, writable: true })
    await vi.waitFor(() => expect(face.hooks.searxngSearchCard.getSnapshot()).toMatchObject({ authEndpoint: 'https://old.test', authConfigured: true }))
    controller.dispose()
  })
})
