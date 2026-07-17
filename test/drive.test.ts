// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { DriveClient, type Transport } from '@/lib/drive'

type CapturedRequest = { method: string; url: string; init?: { headers?: Record<string, string>; body?: BodyInit } }

function fakeTransport(routes: Array<{ match: RegExp; status?: number; json?: any; bytes?: Uint8Array; headers?: Record<string,string> }>): { t: Transport; calls: string[]; requests: CapturedRequest[] } {
  const calls: string[] = []
  const requests: CapturedRequest[] = []
  const t: Transport = async (method, url, init) => {
    calls.push(`${method} ${url}`)
    requests.push({ method, url, init })
    const r = routes.find((x) => x.match.test(url))!
    const body = r.bytes ?? new TextEncoder().encode(JSON.stringify(r.json ?? {}))
    return { status: r.status ?? 200, headers: new Headers(r.headers), bytes: body, text: () => new TextDecoder().decode(body) }
  }
  return { t, calls, requests }
}

test('getAccessToken posts refresh grant and caches', async () => {
  const { t, calls, requests } = fakeTransport([{ match: /oauth2.*token/, json: { access_token: 'AT', expires_in: 3600 } }])
  const c = new DriveClient({ clientId: 'id', clientSecret: 'sec', refreshToken: 'rt' }, t)
  expect(await c.getAccessToken(0)).toBe('AT')
  expect(await c.getAccessToken(1000)).toBe('AT') // cached, no 2nd token call
  expect(calls.filter((x) => /token/.test(x))).toHaveLength(1)

  const tokenReq = requests.find((r) => /oauth2.*token/.test(r.url))!
  const params = new URLSearchParams(tokenReq.init?.body?.toString() ?? '')
  expect(params.get('grant_type')).toBe('refresh_token')
  expect(params.get('refresh_token')).toBe('rt')
  expect(params.get('client_id')).toBe('id')
  expect(params.get('client_secret')).toBe('sec')
})

test('ensureFolder returns existing id when found', async () => {
  const { t, requests } = fakeTransport([
    { match: /oauth2.*token/, json: { access_token: 'AT', expires_in: 3600 } },
    { match: /files\?/, json: { files: [{ id: 'FID', name: 'Rosu Reports' }] } },
  ])
  const c = new DriveClient({ clientId: 'id', clientSecret: 'sec', refreshToken: 'rt' }, t)
  expect(await c.ensureFolder('Rosu Reports')).toBe('FID')

  const filesReq = requests.find((r) => r.method === 'GET' && /files\?/.test(r.url))!
  expect(filesReq.init?.headers?.Authorization).toBe('Bearer AT')
})

test('uploadFile returns new id', async () => {
  const { t, requests } = fakeTransport([
    { match: /oauth2.*token/, json: { access_token: 'AT', expires_in: 3600 } },
    { match: /upload\/drive/, json: { id: 'NEW' } },
  ])
  const c = new DriveClient({ clientId: 'id', clientSecret: 'sec', refreshToken: 'rt' }, t)
  expect(await c.uploadFile({ name: 'a.zip', mimeType: 'application/zip', bytes: new Uint8Array([1]), parent: 'P' })).toBe('NEW')

  const uploadReq = requests.find((r) => /upload\/drive/.test(r.url))!
  expect(uploadReq.init?.headers?.Authorization).toBe('Bearer AT')
  const contentType = uploadReq.init?.headers?.['Content-Type'] ?? ''
  expect(contentType.startsWith('multipart/related; boundary=')).toBe(true)
  const boundary = contentType.slice('multipart/related; boundary='.length)
  const bodyText = new TextDecoder().decode(uploadReq.init?.body as Uint8Array)
  expect(bodyText).toContain('a.zip')
  expect(bodyText).toContain(`--${boundary}--`)
})
