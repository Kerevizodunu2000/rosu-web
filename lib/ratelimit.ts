// SPDX-License-Identifier: GPL-3.0-or-later
export type RateDeps = {
  countEventsSince: (ipHash: string, sinceIso: string) => Promise<number>
  countAllEventsSince: (sinceIso: string) => Promise<number>
  recordRateEvent: (ipHash: string) => Promise<void>
}
const PER_IP_MIN = 5, PER_IP_DAY = 30, GLOBAL_DAY = 500
export async function checkRateLimit(ipHash: string, deps: RateDeps, now = Date.now()):
  Promise<{ allowed: boolean; reason?: string }> {
  const minAgo = new Date(now - 60_000).toISOString()
  const dayAgo = new Date(now - 86_400_000).toISOString()
  if (await deps.countEventsSince(ipHash, minAgo) >= PER_IP_MIN) return { allowed: false, reason: 'rate_minute' }
  if (await deps.countEventsSince(ipHash, dayAgo) >= PER_IP_DAY) return { allowed: false, reason: 'rate_day' }
  if (await deps.countAllEventsSince(dayAgo) >= GLOBAL_DAY) return { allowed: false, reason: 'rate_global' }
  await deps.recordRateEvent(ipHash)
  return { allowed: true }
}
