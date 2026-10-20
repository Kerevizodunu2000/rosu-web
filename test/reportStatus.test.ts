// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { newStatusToken, hashStatusToken, isStatusToken, publicBaseUrl, statusUrl, parseStatusUpdate } from '@/lib/reportStatus'

test('tokens are 256-bit base64url and hash deterministically', () => {
  const a = newStatusToken(), b = newStatusToken()
  expect(isStatusToken(a)).toBe(true)
  expect(a).not.toBe(b)
  expect(hashStatusToken(a)).toBe(hashStatusToken(a))
  expect(hashStatusToken(a)).toMatch(/^[0-9a-f]{64}$/)
  expect(isStatusToken('../../etc')).toBe(false)
  expect(isStatusToken(a + 'x')).toBe(false)
})

test('public base URL never comes from the request', () => {
  expect(publicBaseUrl({ VERCEL_ENV: 'production', VERCEL_URL: 'rosu-abc.vercel.app' })).toBe('https://rosu-web.vercel.app')
  expect(publicBaseUrl({ VERCEL_ENV: 'preview', VERCEL_URL: 'rosu-abc.vercel.app' })).toBe('https://rosu-abc.vercel.app')
  expect(publicBaseUrl({})).toBe('https://rosu-web.vercel.app')
  expect(statusUrl('T', 'https://x.test')).toBe('https://x.test/report/status/T')
})

test('status update validation', () => {
  expect(parseStatusUpdate({ id: 3, status: 'fixed', fixed_in: '1.8.0', status_note: '  thanks  ' }))
    .toEqual({ ok: true, value: { id: 3, status: 'fixed', fixed_in: 'v1.8.0', status_note: 'thanks' } })
  // fixed_in only kept for "fixed"
  expect(parseStatusUpdate({ id: 3, status: 'in_review', fixed_in: '1.8.0' }))
    .toEqual({ ok: true, value: { id: 3, status: 'in_review', fixed_in: null, status_note: null } })
  expect(parseStatusUpdate({ id: 3, status: 'fixed', fixed_in: 'soon' })).toEqual({ ok: false, error: 'bad_version' })
  expect(parseStatusUpdate({ id: 3, status: 'pwned' })).toEqual({ ok: false, error: 'bad_status' })
  expect(parseStatusUpdate({ id: -1, status: 'fixed' })).toEqual({ ok: false, error: 'bad_id' })
  expect(parseStatusUpdate(null)).toEqual({ ok: false, error: 'bad_json' })
  const long = parseStatusUpdate({ id: 1, status: 'closed', status_note: 'x'.repeat(1000) })
  expect(long.ok && long.value.status_note?.length).toBe(280)
})
