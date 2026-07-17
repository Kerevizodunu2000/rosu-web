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
