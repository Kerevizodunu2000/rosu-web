// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { DriveClient, type Transport } from '@/lib/drive'

function fakeTransport(routes: Array<{ match: RegExp; status?: number; json?: any; bytes?: Uint8Array; headers?: Record<string,string> }>): { t: Transport; calls: string[] } {
  const calls: string[] = []
  const t: Transport = async (method, url) => {
    calls.push(`${method} ${url}`)
    const r = routes.find((x) => x.match.test(url))!
    const body = r.bytes ?? new TextEncoder().encode(JSON.stringify(r.json ?? {}))
    return { status: r.status ?? 200, headers: new Headers(r.headers), bytes: body, text: () => new TextDecoder().decode(body) }
  }
  return { t, calls }
}

test('getAccessToken posts refresh grant and caches', async () => {
  const { t, calls } = fakeTransport([{ match: /oauth2.*token/, json: { access_token: 'AT', expires_in: 3600 } }])
  const c = new DriveClient({ clientId: 'id', clientSecret: 'sec', refreshToken: 'rt' }, t)
  expect(await c.getAccessToken(0)).toBe('AT')
  expect(await c.getAccessToken(1000)).toBe('AT') // cached, no 2nd token call
  expect(calls.filter((x) => /token/.test(x))).toHaveLength(1)
})

test('ensureFolder returns existing id when found', async () => {
  const { t } = fakeTransport([
    { match: /oauth2.*token/, json: { access_token: 'AT', expires_in: 3600 } },
    { match: /files\?/, json: { files: [{ id: 'FID', name: 'Rosu Reports' }] } },
  ])
  const c = new DriveClient({ clientId: 'id', clientSecret: 'sec', refreshToken: 'rt' }, t)
  expect(await c.ensureFolder('Rosu Reports')).toBe('FID')
})

test('uploadFile returns new id', async () => {
  const { t } = fakeTransport([
    { match: /oauth2.*token/, json: { access_token: 'AT', expires_in: 3600 } },
    { match: /upload\/drive/, json: { id: 'NEW' } },
  ])
  const c = new DriveClient({ clientId: 'id', clientSecret: 'sec', refreshToken: 'rt' }, t)
  expect(await c.uploadFile({ name: 'a.zip', mimeType: 'application/zip', bytes: new Uint8Array([1]), parent: 'P' })).toBe('NEW')
})
