// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect, beforeAll } from 'vitest'
import { neon } from '@neondatabase/serverless'
import * as db from '@/lib/db'
const url = process.env.DATABASE_URL
const maybe = url ? test : test.skip
let sql: db.Sql
beforeAll(async () => { if (url) { sql = neon(url) } })
maybe('insert + list + archive round-trip', async () => {
  const { id } = await db.insertReport(sql, { source: 'web', title: 't', description: 'd', contact: '', app_version: '1', os: 'x', lang: 'en', ip_hash: 'h' })
  expect(id).toBeGreaterThan(0)
  const recent = await db.listRecentUnarchived(sql, 10)
  expect(recent.find((r) => r.id === id)).toBeTruthy()
  expect(await db.markArchived(sql, [id], 'rosu-reports-test.zip')).toEqual([id])
  expect(await db.listReportById(sql, id).then((r) => r?.archived_at)).toBeTruthy()
  expect(await db.markArchived(sql, [id, 2_000_000_000], 'rosu-reports-again.zip')).toEqual([])  // once only
  expect(await db.listReportById(sql, id).then((r) => r?.archive_ref)).toBe('rosu-reports-test.zip')
  // A deletion only goes through while archive_ref is what the caller cleaned.
  expect(await db.deleteReportRow(sql, id, null)).toBe(false)
  expect(await db.deleteReportRow(sql, id, 'rosu-reports-test.zip')).toBe(true)
})

maybe('admin search, bulk status and delete (v1.5)', async () => {
  const marker = `zz-${Date.now()}`
  const add = (title: string) => db.insertReport(sql, { source: 'web', title, description: `${marker} 50% done`, contact: '',
    app_version: '1.9.0', os: 'x', lang: 'en', ip_hash: 'h' })
  const a = await add('first'), b = await add('second')
  const base = { unarchivedOnly: false, exactId: null, status: null, source: null, limit: 50, offset: 0 } as const
  const found = await db.searchReports(sql, { ...base, pattern: `%${marker}%` })
  expect(found.rows.map((r) => r.id).sort()).toEqual([a.id, b.id].sort())
  expect(await db.setReportStatus(sql, a.id, { status: 'fixed', fixed_in: 'v1.9.0', status_note: 'thanks!' })).toBe(true)
  // Bulk: each report keeps its own note, and its version while it stays fixed.
  expect(await db.setReportStatusMany(sql, [a.id, b.id], { status: 'fixed', fixed_in: null, status_note: null }))
    .toHaveLength(2)
  expect(await db.listReportById(sql, a.id)).toMatchObject({ fixed_in: 'v1.9.0', status_note: 'thanks!' })
  expect(await db.setReportStatusMany(sql, [a.id, b.id], { status: 'closed', fixed_in: null, status_note: null }))
    .toHaveLength(2)
  expect(await db.listReportById(sql, a.id)).toMatchObject({ status: 'closed', fixed_in: null, status_note: 'thanks!' })
  expect((await db.searchReports(sql, { ...base, pattern: `%${marker}%`, status: 'closed' })).total).toBe(2)
  // Status counts follow the other filters (text, source), not the status itself.
  expect(await db.statusCounts(sql, { unarchivedOnly: false, pattern: `%${marker}%`, source: 'web' }))
    .toEqual({ received: 0, in_review: 0, fixed: 0, closed: 2 })
  expect((await db.statusCounts(sql, { unarchivedOnly: false, pattern: `%${marker}%`, source: 'app' })).closed).toBe(0)
  expect(await db.deleteReportRow(sql, a.id, null)).toBe(true)
  expect(await db.deleteReportRow(sql, b.id, null)).toBe(true)
  expect((await db.searchReports(sql, { ...base, pattern: `%${marker}%` })).total).toBe(0)
})

maybe('job locks are leases that run out (v1.6)', async () => {
  const name = `test-lock-${Date.now()}`
  expect(await db.acquireJobLock(sql, name, 'a', 60)).toBe(true)
  expect(await db.acquireJobLock(sql, name, 'b', 60)).toBe(false)
  await db.releaseJobLock(sql, name, 'b')                  // not b's to release
  expect(await db.acquireJobLock(sql, name, 'b', 60)).toBe(false)
  await db.releaseJobLock(sql, name, 'a')
  expect(await db.acquireJobLock(sql, name, 'b', 0)).toBe(true)
  await new Promise((r) => setTimeout(r, 20))
  expect(await db.acquireJobLock(sql, name, 'c', 60)).toBe(true)   // b's lease ran out
  await db.releaseJobLock(sql, name, 'c')
})
