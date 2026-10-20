// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { checkRateLimit, LOGIN_LIMITS, ACK_LIMITS } from '@/lib/ratelimit'
const deps = (perIpMin: number, perIpDay: number, global: number) => {
  let recorded = 0
  return {
    recorded: () => recorded,
    d: {
      countEventsSince: async (_ip: string, sinceIso: string) =>
        new Date(sinceIso).getTime() > Date.now() - 61_000 ? perIpMin : perIpDay,
      countAllEventsSince: async () => global,
      recordRateEvent: async () => { recorded++ },
    },
  }
}
test('allows and records under caps', async () => {
  const { d, recorded } = deps(0, 0, 0)
  expect((await checkRateLimit('h', d)).allowed).toBe(true)
  expect(recorded()).toBe(1)
})
test('blocks over per-ip minute cap', async () => {
  const { d } = deps(5, 0, 0)
  expect((await checkRateLimit('h', d)).allowed).toBe(false)
})
test('blocks over per-ip day cap', async () => {
  const { d } = deps(0, 30, 0)
  expect((await checkRateLimit('h', d)).allowed).toBe(false)
})
test('blocks over global day cap', async () => {
  const { d } = deps(0, 0, 500)
  expect((await checkRateLimit('h', d)).allowed).toBe(false)
})
test('login limits have no global cap (owner cannot be locked out by spray)', async () => {
  const { d } = deps(0, 0, 1_000_000)
  expect((await checkRateLimit('h', d, Date.now(), LOGIN_LIMITS)).allowed).toBe(true)
})
test('ack e-mail budget is much tighter than reports', async () => {
  const { d } = deps(0, 3, 0)
  expect((await checkRateLimit('h', d, Date.now(), ACK_LIMITS)).allowed).toBe(false)
})
