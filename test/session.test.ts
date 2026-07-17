// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { createSession, verifySession } from '@/lib/session'
test('round-trips a valid session', async () => {
  const t = await createSession('secret-value-32-bytes-minimum-xxxx')
  expect(await verifySession(t, 'secret-value-32-bytes-minimum-xxxx')).toBe(true)
})
test('rejects wrong secret / missing / garbage', async () => {
  const t = await createSession('secret-value-32-bytes-minimum-xxxx')
  expect(await verifySession(t, 'different-secret-32-bytes-minimum!')).toBe(false)
  expect(await verifySession(undefined, 'secret-value-32-bytes-minimum-xxxx')).toBe(false)
  expect(await verifySession('garbage', 'secret-value-32-bytes-minimum-xxxx')).toBe(false)
})
test('rejects expired session', async () => {
  const t = await createSession('secret-value-32-bytes-minimum-xxxx', -1)
  expect(await verifySession(t, 'secret-value-32-bytes-minimum-xxxx')).toBe(false)
})
