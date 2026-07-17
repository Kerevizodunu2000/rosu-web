// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { checkRateLimit } from '@/lib/ratelimit'
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
