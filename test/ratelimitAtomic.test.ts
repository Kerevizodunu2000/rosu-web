// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { checkRateLimit, LOGIN_LIMITS, REPORT_LIMITS, type RateLimits, type RateReason } from '@/lib/ratelimit'
import { tryRecordRateEvent, type Sql } from '@/lib/db'

test('the atomic dep is called once and its answer mapped', async () => {
  for (const reason of [null, 'rate_minute', 'rate_day', 'rate_global'] as const) {
    const calls: unknown[][] = []
    const r = await checkRateLimit('h1', {
      tryRecordRateEvent: async (...a) => { calls.push(a); return reason },
    }, 1234, REPORT_LIMITS)
    expect(calls).toEqual([['h1', REPORT_LIMITS, 1234]])
    expect(r).toEqual(reason === null ? { allowed: true } : { allowed: false, reason })
  }
})

test('serialized count-then-insert lets exactly the limit through in parallel', async () => {
  const rows: { ip: string; at: number }[] = []
  let chain = Promise.resolve()
  const tryRecord = (ip: string, l: RateLimits, now: number) => {
    const run = chain.then(async (): Promise<null | RateReason> => {
      const mine = rows.filter((r) => r.ip === ip)
      await new Promise((r) => setTimeout(r, 1)) // a query round-trip between count and insert
      if (mine.filter((r) => r.at > now - 60_000).length >= l.perIpMinute) return 'rate_minute'
      rows.push({ ip, at: now })
      return null
    })
    chain = run.then(() => undefined)
    return run
  }
  const limits = { perIpMinute: 5, perIpDay: 30, globalDay: 500 }
  const results = await Promise.all(Array.from({ length: 20 }, () =>
    checkRateLimit('ip', { tryRecordRateEvent: tryRecord }, Date.now(), limits)))
  expect(results.filter((r) => r.allowed)).toHaveLength(5)
  expect(rows).toHaveLength(5)
})

const fakeSql = () => {
  const queries: { text: string; values: unknown[] }[] = []
  let transactions = 0, direct = 0
  const txn = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const q = { text: strings.join('$'), values }
    queries.push(q)
    return q
  }
  const sql = Object.assign(() => { direct++; return Promise.resolve([]) }, {
    transaction: async (fn: (t: typeof txn) => unknown[]) => {
      transactions++
      return fn(txn).map((_, i) => (i === 0 ? [{}] : [{ reason: null }]))
    },
  })
  return { sql: sql as unknown as Sql, queries, counts: () => ({ transactions, direct }) }
}

test('tryRecordRateEvent runs one transaction behind an advisory lock', async () => {
  const f = fakeSql()
  expect(await tryRecordRateEvent(f.sql, 'h', 'login', LOGIN_LIMITS, Date.now())).toBeNull()
  expect(f.counts()).toEqual({ transactions: 1, direct: 0 })
  expect(f.queries[0].text).toContain('pg_advisory_xact_lock')
  expect(f.queries[0].values).toEqual(['login:h']) // no global cap: per-IP lock
  expect(f.queries.flatMap((q) => q.values)).not.toContain(Number.POSITIVE_INFINITY)
})

test('a global cap serializes the whole kind', async () => {
  const f = fakeSql()
  await tryRecordRateEvent(f.sql, 'h', 'report', REPORT_LIMITS, Date.now())
  expect(f.queries[0].values).toEqual(['report'])
  expect(f.queries[1].values).toContain(REPORT_LIMITS.globalDay)
})
