// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { passwordOk, lockoutRemaining, handleLogin, type LoginDeps, FREE_FAILURES } from '@/lib/adminAuth'
import { hotp, base32Decode, totpStep } from '@/lib/totp'

const SEED = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
const NOW = Date.UTC(2026, 9, 20, 12)

test('passwordOk', () => {
  expect(passwordOk('secret', 'secret')).toBe(true)
  expect(passwordOk('secret', 'nope')).toBe(false)
  expect(passwordOk('x', '')).toBe(false) // unset password never grants access
})

test('lockout: free attempts, then doubling delays capped at 15 min', () => {
  const last = new Date(NOW).toISOString()
  expect(lockoutRemaining(FREE_FAILURES - 1, last, NOW)).toBe(0)
  expect(lockoutRemaining(FREE_FAILURES, last, NOW)).toBe(30)
  expect(lockoutRemaining(FREE_FAILURES + 1, last, NOW)).toBe(60)
  expect(lockoutRemaining(FREE_FAILURES + 20, last, NOW)).toBe(900)
  expect(lockoutRemaining(FREE_FAILURES, last, NOW + 31_000)).toBe(0) // waited it out
  expect(lockoutRemaining(10, null, NOW)).toBe(0)
})

function deps(over: Partial<LoginDeps> = {}) {
  const audit: string[] = []
  const used = new Set<number>()
  let sessions = 0
  let failures = 0
  const d: LoginDeps = {
    adminPassword: 'pw', totpSecret: '',
    checkRateLimit: async () => ({ allowed: true }),
    failuresSince: async () => ({ count: 0, last: null }),
    recordFailure: async () => { failures++ },
    claimTotpStep: async (s) => (used.has(s) ? false : (used.add(s), true)),
    audit: async (e, detail) => { audit.push(detail ? `${e}:${detail}` : e) },
    startSession: async () => { sessions++; return { token: 'T', maxAge: 60 } },
    ...over,
  }
  return { d, audit, sessions: () => sessions, failures: () => failures }
}

test('password-only login succeeds and is audited', async () => {
  const { d, audit, sessions } = deps()
  const r = await handleLogin({ password: 'pw', code: '' }, d, NOW)
  expect(r.status).toBe(200)
  expect(r.session?.token).toBe('T')
  expect(sessions()).toBe(1)
  expect(audit).toEqual(['login_ok:password'])
})

test('wrong password: generic error, counted + audited, no session', async () => {
  const { d, audit, sessions, failures } = deps()
  const r = await handleLogin({ password: 'nope', code: '' }, d, NOW)
  expect(r).toMatchObject({ status: 401, body: { ok: false, error: 'invalid' } })
  expect(sessions()).toBe(0)
  expect(failures()).toBe(1)
  expect(audit).toEqual(['login_fail:password'])
})

test('TOTP required when configured; each code works once', async () => {
  const { d, audit } = deps({ totpSecret: SEED })
  const code = hotp(base32Decode(SEED), totpStep(NOW))
  expect((await handleLogin({ password: 'pw', code: '' }, d, NOW)).status).toBe(401)
  expect((await handleLogin({ password: 'pw', code: '000000' === code ? '111111' : '000000' }, d, NOW)).status).toBe(401)
  expect((await handleLogin({ password: 'pw', code }, d, NOW)).status).toBe(200)
  expect((await handleLogin({ password: 'pw', code }, d, NOW)).status).toBe(401) // replay
  expect(audit).toEqual(['login_fail:totp_missing', 'login_fail:totp', 'login_ok:password+totp', 'login_fail:totp_replay'])
})

test('lockout blocks even the right password, says how long, and is not audited', async () => {
  const { d, sessions, audit } = deps({ failuresSince: async () => ({ count: 4, last: new Date(NOW - 10_000).toISOString() }) })
  const r = await handleLogin({ password: 'pw', code: '' }, d, NOW)
  expect(r.status).toBe(429)
  expect(r.body).toEqual({ ok: false, error: 'locked', retry_after: 50 })
  expect(sessions()).toBe(0)
  expect(audit).toEqual([])
})

test('rate limit is checked first', async () => {
  const { d, audit } = deps({ checkRateLimit: async () => ({ allowed: false }) })
  const r = await handleLogin({ password: 'pw', code: '' }, d, NOW)
  expect(r).toMatchObject({ status: 429, body: { error: 'rate_limited' } })
  expect(audit).toEqual([])
})

test('non-string inputs are treated as empty', async () => {
  const { d } = deps()
  expect((await handleLogin({ password: { $ne: 1 }, code: 5 }, d, NOW)).status).toBe(401)
})
