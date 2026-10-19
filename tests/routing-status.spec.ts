import { Context } from '@deepseek-ai/cordis'
import { expect, it, vi } from 'vitest'
import { readRoutingStatus } from '../src/routing-status.ts'
import { parseServiceStatus } from '../src/runtime-types.ts'

it('reads rc.2 public live Web fields before settings views and handles mixed routes', () => {
  const ctx = new Context()
  let search = 'searxng', fetch = 'deepseek-fetch-api'
  ctx.provide('web', { config: { searchProvider: { get: () => search }, fetchProvider: { get: () => fetch } } })
  const describe = vi.fn(() => [{ ns: 'web', value: { searchProvider: 'stale-provider' } }])
  ctx.provide('settings', { describe })
  const permissions = { searchApi: false, fetchApi: true, legacySearch: false }
  expect(readRoutingStatus(ctx, {}, permissions)).toEqual({ searchProvider: 'searxng', fetchProvider: 'deepseek-fetch-api', searchSource: 'configuration', fetchSource: 'configuration', fallback: permissions })
  search = 'deepseek-official'; fetch = 'http'
  expect(readRoutingStatus(ctx, {}, permissions)).toMatchObject({ searchProvider: search, fetchProvider: fetch })
  expect(describe).not.toHaveBeenCalled()
})

it('uses the public alpha.2 constructor config and does not infer a free automatic route', () => {
  const ctx = new Context()
  ctx.provide('loader', { entries: () => [{ options: { id: 'web' }, fiber: { config: { searchProvider: 'searxng' } } }] })
  expect(readRoutingStatus(ctx, {})).toEqual({ searchProvider: 'searxng', fetchProvider: null, searchSource: 'configuration', fetchSource: 'automatic' })
  expect(readRoutingStatus(ctx, { fetchProvider: 'deepseek-fetch-api' })).toMatchObject({ fetchProvider: 'deepseek-fetch-api', fetchSource: 'environment' })
})

it('marks missing, invalid and throwing fields unconfirmed without discarding the other operation', () => {
  const ctx = new Context()
  expect(readRoutingStatus(ctx, {})).toMatchObject({ searchSource: 'unavailable', fetchSource: 'unavailable' })
  ctx.provide('web', { config: { searchProvider: { get() { throw new Error('private text') } }, fetchProvider: 'http' } })
  expect(readRoutingStatus(ctx, {})).toEqual({ searchProvider: null, fetchProvider: 'http', searchSource: 'unavailable', fetchSource: 'configuration' })
  const second = new Context()
  second.provide('web', { config: { searchProvider: 'https://key.example/secret', fetchProvider: 'http' } })
  expect(JSON.stringify(readRoutingStatus(second, {}))).not.toContain('secret')
})

it('validates cost metadata and keeps older server snapshots unconfirmed', () => {
  const base = { phase: 'ready', endpoint: '', message: '', logs: '', routing: { searchProvider: 'searxng', fetchProvider: 'http' } }
  expect(parseServiceStatus(base).routing?.fallback).toBeUndefined()
  expect(() => parseServiceStatus({ ...base, routing: { ...base.routing, searchSource: 'guaranteed-free' } })).toThrow('Invalid routing source')
  expect(() => parseServiceStatus({ ...base, routing: { ...base.routing, fallback: { searchApi: 'false' } } })).toThrow('Invalid routing permissions')
})
