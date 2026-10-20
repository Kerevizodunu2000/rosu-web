// SPDX-License-Identifier: GPL-3.0-or-later
import { constantTimeEqual } from './crypto'
import { verifyTotp } from './totp'

export function passwordOk(input: string, expected: string): boolean {
  return !!expected && constantTimeEqual(input, expected)
}

/** Failed attempts (per IP-hash) looked back over when deciding a lockout. */
export const LOCKOUT_LOOKBACK_MS = 30 * 60 * 1000
/** Failures allowed before the first delay kicks in. */
export const FREE_FAILURES = 3
const BASE_DELAY_S = 30
const MAX_DELAY_S = 15 * 60

/**
 * Progressive delay: after FREE_FAILURES failures each further one doubles the
 * wait (30 s, 60 s, 2 min … capped at 15 min), measured from the latest failure.
 * Returns the seconds still to wait, or 0.
 */
export function lockoutRemaining(failures: number, lastFailureIso: string | null, nowMs: number): number {
  if (failures < FREE_FAILURES || !lastFailureIso) return 0
  const delay = Math.min(BASE_DELAY_S * 2 ** (failures - FREE_FAILURES), MAX_DELAY_S)
  const until = Date.parse(lastFailureIso) + delay * 1000
  return until > nowMs ? Math.ceil((until - nowMs) / 1000) : 0
}

export type LoginDeps = {
  adminPassword: string
  /** Base32 TOTP secret; empty = 2FA not configured. */
  totpSecret: string
  checkRateLimit: () => Promise<{ allowed: boolean; reason?: string }>
  failuresSince: (sinceIso: string) => Promise<{ count: number; last: string | null }>
  claimTotpStep: (step: number) => Promise<boolean>
  audit: (event: 'login_ok' | 'login_fail' | 'login_locked', detail?: string) => Promise<void>
  startSession: () => Promise<{ token: string; maxAge: number }>
}
export type LoginResult = {
  status: number
  body: { ok: boolean; error?: string; retry_after?: number }
  session?: { token: string; maxAge: number }
}

/**
 * Admin sign-in: per-IP rate limit → progressive lockout → password (constant
 * time) → TOTP when configured (each code accepted once). Every outcome is
 * audited; the client only ever learns "invalid", never which factor failed.
 */
export async function handleLogin(input: { password: unknown; code: unknown }, deps: LoginDeps, nowMs = Date.now()): Promise<LoginResult> {
  const rl = await deps.checkRateLimit()
  if (!rl.allowed) return { status: 429, body: { ok: false, error: 'rate_limited' } }

  const recent = await deps.failuresSince(new Date(nowMs - LOCKOUT_LOOKBACK_MS).toISOString())
  const wait = lockoutRemaining(recent.count, recent.last, nowMs)
  if (wait > 0) {
    await deps.audit('login_locked', `retry_after=${wait}`)
    return { status: 429, body: { ok: false, error: 'locked', retry_after: wait } }
  }

  const password = typeof input.password === 'string' ? input.password : ''
  const code = typeof input.code === 'string' ? input.code.replace(/\s/g, '') : ''
  if (!passwordOk(password, deps.adminPassword)) {
    await deps.audit('login_fail', 'password')
    return { status: 401, body: { ok: false, error: 'invalid' } }
  }
  if (deps.totpSecret) {
    const step = verifyTotp(deps.totpSecret, code, nowMs)
    if (step === null) {
      await deps.audit('login_fail', code ? 'totp' : 'totp_missing')
      return { status: 401, body: { ok: false, error: 'invalid' } }
    }
    if (!(await deps.claimTotpStep(step))) {
      await deps.audit('login_fail', 'totp_replay')
      return { status: 401, body: { ok: false, error: 'invalid' } }
    }
  }
  const session = await deps.startSession()
  await deps.audit('login_ok', deps.totpSecret ? 'password+totp' : 'password')
  return { status: 200, body: { ok: true }, session }
}
