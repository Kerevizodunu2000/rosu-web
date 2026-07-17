// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { verifyTurnstile } from '@/lib/turnstile'
const fakeFetch = (body: any) => (async () => ({ json: async () => body })) as unknown as typeof fetch
test('empty token is false without a network call', async () => {
  expect(await verifyTurnstile('', 'sec')).toBe(false)
})
test('true when siteverify says success', async () => {
  expect(await verifyTurnstile('tok', 'sec', { fetchImpl: fakeFetch({ success: true }) })).toBe(true)
})
test('false when siteverify fails', async () => {
  expect(await verifyTurnstile('tok', 'sec', { fetchImpl: fakeFetch({ success: false }) })).toBe(false)
})
