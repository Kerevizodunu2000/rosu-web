// SPDX-License-Identifier: GPL-3.0-or-later
import { createHash, timingSafeEqual } from 'node:crypto'
export function hashIp(ip: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}
/**
 * Compare secrets in constant time — including their length: both sides are
 * hashed to a fixed 32 bytes first, so a mismatch in length takes as long as
 * any other mismatch and the secret's length never leaks.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb) && a.length === b.length
}
