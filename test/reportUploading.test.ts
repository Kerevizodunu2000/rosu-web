// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { handleReport, type ReportDeps } from '@/lib/reportService'

const run = async (raw: Record<string, unknown>) => {
  const calls: string[] = []
  const inserted: Parameters<ReportDeps['insertReport']>[0][] = []
  const deps: ReportDeps = {
    salt: 's', appToken: 'APPTOK', turnstileSecret: 'T', verifyTurnstile: async () => true,
    checkRateLimit: async () => ({ allowed: true }),
    insertReport: async (r) => { calls.push('insert'); inserted.push(r); return { id: 7 } },
    setReportImage: async (_id, v) => { calls.push(`image:${v.image_status}`) },
    uploadImage: async () => 'D1',
    newStatusToken: () => 'TOK', statusUrl: (t) => t, ackEmailEnabled: false, allowAck: async () => false,
  }
  await handleReport({ raw: { title: 't', description: 'd', hp: '', token: 'APPTOK', ...raw }, ip: '1.1.1.1', userAgent: 'Rosu/1', deps })
  return { calls, inserted }
}

test('a report with an image is inserted as uploading, then stored', async () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]).toString('base64')
  const { calls, inserted } = await run({ image_b64: png, image_mime: 'image/png' })
  expect(inserted[0].image_status).toBe('uploading')
  expect(calls).toEqual(['insert', 'image:stored'])
})

test('a report without an image is not marked uploading', async () => {
  const { calls, inserted } = await run({})
  expect(inserted[0].image_status).not.toBe('uploading')
  expect(calls).toEqual(['insert'])
})
