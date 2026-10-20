// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { ackConfig, buildAckEmail, sendAckEmail } from '@/lib/email'

test('disabled unless both key and sender are set', () => {
  expect(ackConfig({})).toBeNull()
  expect(ackConfig({ RESEND_API_KEY: 'k' })).toBeNull()
  expect(ackConfig({ ACK_EMAIL_FROM: 'Rosu <a@b.co>' })).toBeNull()
  expect(ackConfig({ RESEND_API_KEY: 'k', ACK_EMAIL_FROM: 'Rosu <a@b.co>' })).toEqual({ apiKey: 'k', from: 'Rosu <a@b.co>' })
})

test('message carries only the number and link, escaped in HTML', () => {
  const m = buildAckEmail({ id: 42, statusUrl: 'https://x.test/report/status/a"b<c' })
  expect(m.subject).toBe('Rosu — we received your report #42')
  expect(m.text).toContain('https://x.test/report/status/a"b<c')
  expect(m.html).toContain('a&quot;b&lt;c')
  expect(m.html).not.toContain('a"b<c')
})

test('sendAckEmail posts to Resend and never throws', async () => {
  let body: Record<string, unknown> = {}
  let auth = ''
  const ok = (async (_u: unknown, init?: RequestInit) => {
    body = JSON.parse(String(init?.body)); auth = String((init?.headers as Record<string, string>).Authorization)
    return new Response('{}', { status: 200 })
  }) as typeof fetch
  expect(await sendAckEmail({ apiKey: 'K', from: 'F' }, 'to@x.co', { id: 1, statusUrl: 'u' }, ok)).toBe(true)
  expect(body).toMatchObject({ from: 'F', to: ['to@x.co'] })
  expect(auth).toBe('Bearer K')
  const boom = (async () => { throw new Error('net') }) as typeof fetch
  expect(await sendAckEmail({ apiKey: 'K', from: 'F' }, 'to@x.co', { id: 1, statusUrl: 'u' }, boom)).toBe(false)
})
