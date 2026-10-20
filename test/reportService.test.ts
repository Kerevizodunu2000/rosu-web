// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { handleReport, type ReportDeps } from '@/lib/reportService'

const baseDeps = (over: Partial<ReportDeps> = {}): ReportDeps => ({
  salt: 'salt', appToken: 'APPTOK', turnstileSecret: 'TSEC',
  verifyTurnstile: async () => true,
  checkRateLimit: async () => ({ allowed: true }),
  insertReport: async () => ({ id: 7 }),
  setReportImage: async () => {},
  uploadImage: async () => 'DRIVEID',
  newStatusToken: () => 'TOKEN',
  statusUrl: (t) => `https://x.test/report/status/${t}`,
  ackEmailEnabled: false,
  allowAck: async () => true,
  ...over,
})
const web = { title: 't', description: 'd', hp: '' }
const desktop = { title: 't', description: 'd', hp: '', token: 'APPTOK' }

test('honeypot: ok, stores nothing', async () => {
  let inserted = false
  const r = await handleReport({ raw: { title: 't', description: 'd', hp: 'bot' }, ip: '1.1.1.1', userAgent: 'x',
    deps: baseDeps({ insertReport: async () => { inserted = true; return { id: 1 } } }) })
  expect(r.body).toEqual({ ok: true, id: 0 }); expect(inserted).toBe(false)
})
test('missing fields → 400', async () => {
  const r = await handleReport({ raw: { title: '', description: '' }, ip: '1.1.1.1', userAgent: 'x', deps: baseDeps() })
  expect(r.status).toBe(400); expect(r.body.error).toBe('missing_fields')
})
test('web path requires a valid turnstile token', async () => {
  const r = await handleReport({ raw: { ...web, turnstileToken: 'bad' }, ip: '1.1.1.1', userAgent: 'Mozilla',
    deps: baseDeps({ verifyTurnstile: async () => false }) })
  expect(r.body).toEqual({ ok: false, error: 'captcha' })
})
test('desktop path (Rosu UA) requires the shared token', async () => {
  const r = await handleReport({ raw: { ...web, token: 'WRONG' }, ip: '1.1.1.1', userAgent: 'Rosu/1.3.3', deps: baseDeps() })
  expect(r.body).toEqual({ ok: false, error: 'unauthorized' })
})
test('desktop happy path returns id + status link', async () => {
  const r = await handleReport({ raw: desktop, ip: '1.1.1.1', userAgent: 'Rosu/1.3.3', deps: baseDeps() })
  expect(r.body).toEqual({ ok: true, id: 7, status_url: 'https://x.test/report/status/TOKEN' })
})
test('rate limited → 429', async () => {
  const r = await handleReport({ raw: desktop, ip: '1.1.1.1', userAgent: 'Rosu/1.3.3',
    deps: baseDeps({ checkRateLimit: async () => ({ allowed: false, reason: 'rate_minute' }) }) })
  expect(r.status).toBe(429); expect(r.body.error).toBe('rate_minute')
})
test('valid image is uploaded and recorded', async () => {
  const png = Buffer.from([0x89,0x50,0x4e,0x47,0,0,0,0]).toString('base64')
  let imaged = ''
  const r = await handleReport({ raw: { ...desktop, image_b64: png, image_mime: 'image/png' }, ip: '1.1.1.1', userAgent: 'Rosu/1.3.3',
    deps: baseDeps({ setReportImage: async (_id, v) => { imaged = v.image_status } }) })
  expect(r.body.ok).toBe(true); expect(imaged).toBe('stored')
})
test('browser with neither auth path → captcha', async () => {
  const r = await handleReport({ raw: { title: 't', description: 'd', hp: '' }, ip: '1.1.1.1', userAgent: 'Mozilla/5.0',
    deps: baseDeps() })
  expect(r.body).toEqual({ ok: false, error: 'captcha' })
})
test('desktop path with empty appToken → unauthorized (fail closed)', async () => {
  const r = await handleReport({ raw: { title: 't', description: 'd', hp: '', token: '' }, ip: '1.1.1.1', userAgent: 'Rosu/1.3.3',
    deps: baseDeps({ appToken: '' }) })
  expect(r.body).toEqual({ ok: false, error: 'unauthorized' })
})
test('invalid image (bad magic bytes) → report saved, image_status error, upload not attempted', async () => {
  const bad = Buffer.from([0, 1, 2, 3]).toString('base64')
  let imaged = ''
  let uploadCalled = false
  const r = await handleReport({ raw: { ...desktop, image_b64: bad, image_mime: 'image/png' }, ip: '1.1.1.1', userAgent: 'Rosu/1.3.3',
    deps: baseDeps({
      setReportImage: async (_id, v) => { imaged = v.image_status },
      uploadImage: async () => { uploadCalled = true; throw new Error('uploadImage should not be called') },
    }) })
  expect(r.body).toMatchObject({ ok: true, id: 7 })
  expect(imaged).toBe('error')
  expect(uploadCalled).toBe(false)
})

test('stores only the hash of the tracking token', async () => {
  let stored = ''
  await handleReport({ raw: desktop, ip: '1.1.1.1', userAgent: 'Rosu/1.3.3',
    deps: baseDeps({ insertReport: async (r) => { stored = r.status_token_hash; return { id: 7 } } }) })
  expect(stored).toMatch(/^[0-9a-f]{64}$/)
  expect(stored).not.toContain('TOKEN')
})
test('ack e-mail follow-up only when opted in, configured, valid and within budget', async () => {
  const raw = { ...desktop, contact: 'me@example.com', ack_email: true }
  const run = (over: Partial<ReportDeps>, r: Record<string, unknown> = raw) =>
    handleReport({ raw: r, ip: '1.1.1.1', userAgent: 'Rosu/1.3.3', deps: baseDeps(over) })
  expect((await run({ ackEmailEnabled: true })).followUp?.ackEmail)
    .toEqual({ to: 'me@example.com', id: 7, statusUrl: 'https://x.test/report/status/TOKEN' })
  expect((await run({ ackEmailEnabled: false })).followUp).toBeUndefined()
  expect((await run({ ackEmailEnabled: true, allowAck: async () => false })).followUp).toBeUndefined()
  expect((await run({ ackEmailEnabled: true }, { ...raw, ack_email: false })).followUp).toBeUndefined()
  expect((await run({ ackEmailEnabled: true }, { ...raw, contact: 'not an email' })).followUp).toBeUndefined()
})
test('honeypot never gets a status link', async () => {
  const r = await handleReport({ raw: { title: 't', description: 'd', hp: 'bot' }, ip: '1.1.1.1', userAgent: 'x', deps: baseDeps() })
  expect(r.body).toEqual({ ok: true, id: 0 })
})
