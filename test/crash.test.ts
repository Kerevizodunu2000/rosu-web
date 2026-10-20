// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { scrubText, cleanFrame, parseCrash, crashFingerprint, handleCrash, type CrashDeps } from '@/lib/crash'

test('scrubText removes paths and e-mail addresses', () => {
  expect(scrubText('No such file: C:\\Users\\halil\\osu!\\Songs\\x.osz')).toBe('No such file: <path>')
  expect(scrubText("open '/home/bob/.config/rosu/x'")).toBe("open '<path>'")
  expect(scrubText('mail bob@example.com now')).toBe('mail <email> now')
  expect(scrubText('\\\\nas\\share\\maps failed')).toBe('<path> failed')
})

test('cleanFrame keeps only module:function, trimmed to the rosu package', () => {
  expect(cleanFrame('C:\\Users\\x\\AppData\\Local\\Temp\\_MEI1\\rosu\\services\\library_svc.py:copy_to_library'))
    .toBe('rosu/services/library_svc.py:copy_to_library')
  expect(cleanFrame('rosu/db.py:upsert_track')).toBe('rosu/db.py:upsert_track')
  expect(cleanFrame('/usr/lib/python3.13/zipfile.py:open')).toBe('zipfile.py:open')
  expect(cleanFrame('rosu/x.py:<module>')).toBe('rosu/x.py:<module>')
  expect(cleanFrame('no function here')).toBeNull()
  expect(cleanFrame('rosu/../../etc/passwd:x')).toBeNull()
})

const valid = { exc_type: 'ValueError', message: 'bad value at C:\\Users\\me\\a.txt', frames: ['rosu/app.py:main', 'rosu/db.py:open'], app_version: '1.8.0', os: 'Windows 11', token: 'TOK' }

test('parseCrash validates shape and scrubs', () => {
  const r = parseCrash(valid)
  expect(r.ok).toBe(true)
  if (r.ok) {
    expect(r.value.message).toBe('bad value at <path>')
    expect(r.value.frames).toEqual(['rosu/app.py:main', 'rosu/db.py:open'])
  }
  expect(parseCrash({ ...valid, exc_type: 'not a type!' })).toEqual({ ok: false, error: 'bad_exc_type' })
  expect(parseCrash({ ...valid, frames: [] })).toEqual({ ok: false, error: 'bad_frames' })
  expect(parseCrash({ ...valid, frames: ['garbage'] })).toEqual({ ok: false, error: 'bad_frames' })
  expect(parseCrash([])).toEqual({ ok: false, error: 'bad_json' })
})

test('fingerprint ignores message and version, not the stack', () => {
  const a = crashFingerprint({ excType: 'ValueError', frames: ['a.py:f', 'b.py:g'] })
  expect(a).toBe(crashFingerprint({ excType: 'ValueError', frames: ['a.py:f', 'b.py:g'] }))
  expect(a).not.toBe(crashFingerprint({ excType: 'ValueError', frames: ['a.py:f', 'b.py:h'] }))
  expect(a).not.toBe(crashFingerprint({ excType: 'KeyError', frames: ['a.py:f', 'b.py:g'] }))
})

test('handleCrash: desktop UA + token required, fail closed, rate limited', async () => {
  const recorded: string[] = []
  const deps = (over: Partial<CrashDeps> = {}): CrashDeps => ({
    appToken: 'TOK', checkRateLimit: async () => ({ allowed: true }),
    record: async (c) => { recorded.push(c.fingerprint) }, ...over,
  })
  expect((await handleCrash({ raw: valid, userAgent: 'Mozilla/5.0', deps: deps() })).status).toBe(403)
  expect((await handleCrash({ raw: { ...valid, token: 'NO' }, userAgent: 'Rosu/1.8.0', deps: deps() })).body.error).toBe('unauthorized')
  expect((await handleCrash({ raw: valid, userAgent: 'Rosu/1.8.0', deps: deps({ appToken: '' }) })).body.error).toBe('unauthorized')
  expect((await handleCrash({ raw: valid, userAgent: 'Rosu/1.8.0', deps: deps({ checkRateLimit: async () => ({ allowed: false, reason: 'rate_day' }) }) })).status).toBe(429)
  const ok = await handleCrash({ raw: { ...valid, fingerprint: 'client-chosen' }, userAgent: 'Rosu/1.8.0', deps: deps() })
  expect(ok.body.ok).toBe(true)
  expect(recorded).toEqual([ok.body.fingerprint])
  expect(ok.body.fingerprint).not.toBe('client-chosen')
})

test('handleCrash rejects a wrong token before doing any parsing work', async () => {
  let rateChecked = false
  const huge = { ...valid, token: 'NO', message: 'a'.repeat(30_000) }
  const t0 = Date.now()
  const r = await handleCrash({ raw: huge, userAgent: 'Rosu/1.8.0',
    deps: { appToken: 'TOK', checkRateLimit: async () => { rateChecked = true; return { allowed: true } }, record: async () => {} } })
  expect(r.body.error).toBe('unauthorized')
  expect(rateChecked).toBe(false)
  expect(Date.now() - t0).toBeLessThan(200)
})

test('a huge message is clipped before scrubbing (bounded time)', () => {
  const t0 = Date.now()
  const r = parseCrash({ ...valid, message: 'a'.repeat(30_000) + '@' })
  expect(Date.now() - t0).toBeLessThan(200)
  expect(r.ok && r.value.message.length).toBeLessThanOrEqual(300)
})
