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
  await db.markArchived(sql, [id], 'rosu-reports-test.zip')
  expect(await db.listReportById(sql, id).then((r) => r?.archived_at)).toBeTruthy()
})

maybe('admin search, bulk status and delete (v1.5)', async () => {
  const marker = `zz-${Date.now()}`
  const add = (title: string) => db.insertReport(sql, { source: 'web', title, description: `${marker} 50% done`, contact: '',
    app_version: '1.9.0', os: 'x', lang: 'en', ip_hash: 'h' })
  const a = await add('first'), b = await add('second')
  const base = { unarchivedOnly: false, exactId: null, status: null, source: null, limit: 50, offset: 0 } as const
  const found = await db.searchReports(sql, { ...base, pattern: `%${marker}%` })
  expect(found.rows.map((r) => r.id).sort()).toEqual([a.id, b.id].sort())
  expect(await db.setReportStatusMany(sql, [a.id, b.id], { status: 'closed', fixed_in: null, status_note: null }))
    .toHaveLength(2)
  expect((await db.searchReports(sql, { ...base, pattern: `%${marker}%`, status: 'closed' })).total).toBe(2)
  expect(await db.deleteReportRow(sql, a.id)).toBe(true)
  expect(await db.deleteReportRow(sql, b.id)).toBe(true)
  expect((await db.searchReports(sql, { ...base, pattern: `%${marker}%` })).total).toBe(0)
})
