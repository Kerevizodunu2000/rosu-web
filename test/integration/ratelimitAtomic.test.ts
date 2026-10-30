// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect, beforeAll } from 'vitest'
import { randomUUID } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import * as db from '@/lib/db'
const url = process.env.DATABASE_URL
const maybe = url ? test : test.skip
let sql: db.Sql
beforeAll(async () => { if (url) { sql = neon(url) } })
maybe('parallel requests cannot pass the per-IP minute limit', async () => {
  const ip = `test-${randomUUID()}`
  const limits = { perIpMinute: 5, perIpDay: 30, globalDay: Number.POSITIVE_INFINITY }
  const results = await Promise.all(Array.from({ length: 20 }, () =>
    db.tryRecordRateEvent(sql, ip, 'login', limits, Date.now())))
  expect(results.filter((r) => r === null)).toHaveLength(5)
  expect(results.filter((r) => r !== null)).toHaveLength(15)
  const rows = await sql`SELECT count(*)::int AS n FROM rate_events WHERE ip_hash = ${ip}` as { n: number }[]
  expect(rows[0].n).toBe(5)
  await sql`DELETE FROM rate_events WHERE ip_hash = ${ip}`
}, 30_000)
