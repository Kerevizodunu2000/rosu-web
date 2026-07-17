// SPDX-License-Identifier: GPL-3.0-or-later
import { SignJWT, jwtVerify } from 'jose'
export const SESSION_COOKIE = 'rosu_admin'
const key = (secret: string) => new TextEncoder().encode(secret)
export async function createSession(secret: string, ttlSeconds = 60 * 60 * 12): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(key(secret))
}
export async function verifySession(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false
  try { await jwtVerify(token, key(secret)); return true } catch { return false }
}
