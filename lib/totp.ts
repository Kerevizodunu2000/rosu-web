// SPDX-License-Identifier: GPL-3.0-or-later
// RFC 6238 TOTP (HMAC-SHA1, 30-second steps, 6 digits) — the defaults every
// authenticator app uses. No dependency: node:crypto does the HMAC.
import { createHmac, timingSafeEqual } from 'node:crypto'

export const TOTP_STEP_SECONDS = 30
const DIGITS = 6
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Decode an RFC 4648 base32 secret (case-insensitive; spaces, dashes and '=' ignored). */
export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[\s=-]/g, '')
  let bits = 0, value = 0
  const out: number[] = []
  for (const ch of clean) {
    const idx = B32.indexOf(ch)
    if (idx < 0) throw new Error('invalid base32 character')
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8 }
  }
  return Uint8Array.from(out)
}

export function hotp(key: Uint8Array, counter: number): string {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const mac = createHmac('sha1', key).update(msg).digest()
  const offset = mac[mac.length - 1] & 0x0f
  const bin = ((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3]
  return String(bin % 10 ** DIGITS).padStart(DIGITS, '0')
}

export function totpStep(nowMs: number): number {
  return Math.floor(nowMs / 1000 / TOTP_STEP_SECONDS)
}

/**
 * Check a 6-digit code against the current step ±`window` (clock drift).
 * Returns the matching step so the caller can mark it used (replay guard), or
 * null. A malformed secret never matches.
 */
export function verifyTotp(secretB32: string, code: string, nowMs = Date.now(), window = 1): number | null {
  if (!/^\d{6}$/.test(code)) return null
  let key: Uint8Array
  try { key = base32Decode(secretB32) } catch { return null }
  if (key.length < 10) return null // < 80 bits: refuse a toy secret
  const step = totpStep(nowMs)
  let matched: number | null = null
  for (let d = -window; d <= window; d++) {
    // Compare every candidate in constant time and without an early exit, so the
    // response time does not reveal which window slot matched.
    const ok = timingSafeEqual(Buffer.from(hotp(key, step + d)), Buffer.from(code))
    if (ok && matched === null) matched = step + d
  }
  return matched
}
