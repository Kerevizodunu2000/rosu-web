// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { base32Decode, hotp, verifyTotp, totpStep } from '@/lib/totp'

// RFC 6238 appendix B, SHA-1 seed "12345678901234567890" (base32 below); the
// RFC lists 8-digit codes, authenticator apps use their last 6 digits.
const SEED = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
const VECTORS: [number, string][] = [
  [59, '287082'], [1111111109, '081804'], [1111111111, '050471'],
  [1234567890, '005924'], [2000000000, '279037'],
]

test('base32 decodes the RFC seed', () => {
  expect(Buffer.from(base32Decode(SEED)).toString()).toBe('12345678901234567890')
  expect(Buffer.from(base32Decode('gezd gnbv-gy3tqojq gezdgnbvgy3tqojq==')).toString()).toBe('12345678901234567890')
  expect(() => base32Decode('not*base32')).toThrow()
})

test('matches the RFC 6238 test vectors', () => {
  const key = base32Decode(SEED)
  for (const [t, code] of VECTORS) expect(hotp(key, totpStep(t * 1000))).toBe(code)
})

test('verifyTotp accepts ±1 step of drift and returns the matched step', () => {
  const t = 1111111111 * 1000
  expect(verifyTotp(SEED, '050471', t)).toBe(totpStep(t))
  expect(verifyTotp(SEED, '050471', t + 30_000)).toBe(totpStep(t)) // one step late
  expect(verifyTotp(SEED, '050471', t + 90_000)).toBeNull()        // too late
})

test('verifyTotp rejects malformed input and toy secrets', () => {
  const t = 1111111111 * 1000
  expect(verifyTotp(SEED, '05047', t)).toBeNull()
  expect(verifyTotp(SEED, 'abcdef', t)).toBeNull()
  expect(verifyTotp('!!!', '050471', t)).toBeNull()
  expect(verifyTotp('GEZDGNBV', '050471', t)).toBeNull() // 40-bit secret
})
