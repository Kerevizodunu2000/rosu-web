// SPDX-License-Identifier: GPL-3.0-or-later
export type RateReason = 'rate_minute' | 'rate_day' | 'rate_global'
/** Count-and-record in one atomic step (lib/db.ts tryRecordRateEvent): null when recorded. */
export type AtomicRateDeps = {
  tryRecordRateEvent: (ipHash: string, limits: RateLimits, nowMs: number) => Promise<null | RateReason>
}
// Not atomic (parallel requests all read the old count): kept for old tests only, no route may use it.
export type LegacyRateDeps = {
  countEventsSince: (ipHash: string, sinceIso: string) => Promise<number>
  countAllEventsSince: (sinceIso: string) => Promise<number>
  recordRateEvent: (ipHash: string) => Promise<void>
}
export type RateDeps = AtomicRateDeps | LegacyRateDeps
export type RateLimits = { perIpMinute: number; perIpDay: number; globalDay: number }

/** Public report endpoint (desktop + web form). */
export const REPORT_LIMITS: RateLimits = { perIpMinute: 5, perIpDay: 30, globalDay: 500 }
/**
 * Admin login. No meaningful global cap: one would let anyone lock the owner out
 * by spraying failed logins from many addresses. Per-IP limits plus the
 * progressive lockout (lib/adminAuth.ts) and TOTP carry the load instead.
 */
export const LOGIN_LIMITS: RateLimits = { perIpMinute: 5, perIpDay: 30, globalDay: Number.POSITIVE_INFINITY }
/**
 * Confirmation e-mails go to an address nobody verified, so they get their own
 * small budget (Resend's free tier is 100/day) on top of the report limits.
 */
export const ACK_LIMITS: RateLimits = { perIpMinute: 2, perIpDay: 3, globalDay: 50 }
/** …and at most one per recipient address per day, however many senders try. */
export const ACK_RECIPIENT_LIMITS: RateLimits = { perIpMinute: 1, perIpDay: 1, globalDay: Number.POSITIVE_INFINITY }
/** Opt-in desktop crash fingerprints: chattier than reports, still bounded. */
export const CRASH_LIMITS: RateLimits = { perIpMinute: 10, perIpDay: 50, globalDay: 3000 }

export async function checkRateLimit(ipHash: string, deps: RateDeps, now = Date.now(), limits: RateLimits = REPORT_LIMITS):
  Promise<{ allowed: boolean; reason?: string }> {
  if ('tryRecordRateEvent' in deps) {
    const reason = await deps.tryRecordRateEvent(ipHash, limits, now)
    return reason === null ? { allowed: true } : { allowed: false, reason }
  }
  const minAgo = new Date(now - 60_000).toISOString()
  const dayAgo = new Date(now - 86_400_000).toISOString()
  if (await deps.countEventsSince(ipHash, minAgo) >= limits.perIpMinute) return { allowed: false, reason: 'rate_minute' }
  if (await deps.countEventsSince(ipHash, dayAgo) >= limits.perIpDay) return { allowed: false, reason: 'rate_day' }
  if (Number.isFinite(limits.globalDay) && await deps.countAllEventsSince(dayAgo) >= limits.globalDay) {
    return { allowed: false, reason: 'rate_global' }
  }
  await deps.recordRateEvent(ipHash)
  return { allowed: true }
}
