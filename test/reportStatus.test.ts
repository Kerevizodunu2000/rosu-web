// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { newStatusToken, hashStatusToken, isStatusToken, publicBaseUrl, statusUrl, parseStatusUpdate, parseBulkStatusUpdate, BULK_MAX } from '@/lib/reportStatus'

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
  // In the reporter's language when it is one the site has; anything else is English.
  expect(statusUrl('T', 'https://x.test', 'tr')).toBe('https://x.test/tr/report/status/T')
  expect(statusUrl('T', 'https://x.test', 'ja')).toBe('https://x.test/ja/report/status/T')
  expect(statusUrl('T', 'https://x.test', 'de-DE')).toBe('https://x.test/report/status/T')
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

test('bulk status validation', () => {
  expect(parseBulkStatusUpdate({ ids: [3, '4', 3], status: 'fixed', fixed_in: '1.9.0' }))
    .toEqual({ ok: true, value: { ids: [3, 4], status: 'fixed', fixed_in: 'v1.9.0', status_note: null } })
  expect(parseBulkStatusUpdate({ ids: [], status: 'fixed' })).toEqual({ ok: false, error: 'bad_ids' })
  expect(parseBulkStatusUpdate({ ids: [1, -2], status: 'fixed' })).toEqual({ ok: false, error: 'bad_ids' })
  expect(parseBulkStatusUpdate({ ids: Array.from({ length: BULK_MAX + 1 }, (_, i) => i + 1), status: 'fixed' }))
    .toEqual({ ok: false, error: 'bad_ids' })
  expect(parseBulkStatusUpdate({ ids: [1], status: 'nope' })).toEqual({ ok: false, error: 'bad_status' })
  expect(parseBulkStatusUpdate({ ids: [1], status: 'fixed', fixed_in: 'latest' })).toEqual({ ok: false, error: 'bad_version' })
})
