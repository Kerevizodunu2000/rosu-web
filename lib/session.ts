// SPDX-License-Identifier: GPL-3.0-or-later
// Admin sessions: a signed cookie that only carries a random session id; the
// session itself lives in Neon (admin_sessions), so logout and "sign out
// everywhere" really end it server-side, and a stolen cookie dies with it.
import { SignJWT, jwtVerify } from 'jose'
import { randomBytes } from 'node:crypto'

// `__Host-` binds the cookie to this exact origin: Secure, Path=/, no Domain.
export const SESSION_COOKIE = '__Host-rosu_admin'
/** Idle timeout: a session not refreshed (by a page load) within this ends. */
export const SESSION_IDLE_SECONDS = 2 * 60 * 60
/** Absolute cap counted from the password+TOTP sign-in, however active. */
export const SESSION_MAX_SECONDS = 12 * 60 * 60
/** A page load after this age swaps the session for a fresh id. */
export const ROTATE_AFTER_SECONDS = 15 * 60
/** How long a rotated-out id keeps working, for requests already in flight. */
export const ROTATION_GRACE_SECONDS = 60

export type SessionClaims = { sid: string; authTime: number; issuedAt: number; exp: number }

export type SessionStore = {
  insert: (v: { id: string; authTime: string; expiresAt: string }) => Promise<void>
  /** Live = exists, not revoked, not expired. */
  isLive: (id: string) => Promise<boolean>
  expireAt: (id: string, atIso: string) => Promise<void>
}

const key = (secret: string) => new TextEncoder().encode(secret)
const sec = (ms: number) => Math.floor(ms / 1000)
export const newSessionId = () => randomBytes(32).toString('base64url')

async function sign(secret: string, c: { sid: string; authTime: number; exp: number }, nowS: number): Promise<string> {
  return new SignJWT({ sid: c.sid, at: c.authTime })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(nowS)
    .setExpirationTime(c.exp)
    .sign(key(secret))
}

/** Verify the cookie's signature and expiry only (no database). */
export async function readSessionToken(token: string | undefined, secret: string, nowMs = Date.now()): Promise<SessionClaims | null> {
  if (!token || !secret) return null
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ['HS256'], currentDate: new Date(nowMs) })
    if (typeof payload.sid !== 'string' || typeof payload.at !== 'number' || typeof payload.iat !== 'number' || typeof payload.exp !== 'number') return null
    return { sid: payload.sid, authTime: payload.at, issuedAt: payload.iat, exp: payload.exp }
  } catch { return null }
}

/** Start a session (sign-in) or continue one (rotation, same `authTime`). */
export async function issueSession(store: SessionStore, secret: string, opts: { nowMs?: number; authTime?: number } = {}):
  Promise<{ token: string; maxAge: number; sid: string }> {
  const nowS = sec(opts.nowMs ?? Date.now())
  const authTime = opts.authTime ?? nowS
  const exp = Math.min(authTime + SESSION_MAX_SECONDS, nowS + SESSION_IDLE_SECONDS)
  if (exp <= nowS) throw new Error('session past its absolute lifetime')
  const sid = newSessionId()
  await store.insert({ id: sid, authTime: new Date(authTime * 1000).toISOString(), expiresAt: new Date(exp * 1000).toISOString() })
  return { token: await sign(secret, { sid, authTime, exp }, nowS), maxAge: exp - nowS, sid }
}

/** Full check: valid signature AND a live server-side session. */
export async function verifySession(store: SessionStore, token: string | undefined, secret: string, nowMs = Date.now()): Promise<SessionClaims | null> {
  const claims = await readSessionToken(token, secret, nowMs)
  if (!claims) return null
  return (await store.isLive(claims.sid)) ? claims : null
}

/**
 * If the session is old enough, issue a replacement (same sign-in time, so the
 * absolute cap still holds) and let the old id lapse after a short grace
 * window. Returns null when no rotation is due or the session is not valid.
 */
export async function rotateIfDue(store: SessionStore, token: string | undefined, secret: string, nowMs = Date.now()):
  Promise<{ token: string; maxAge: number; sid: string } | null> {
  const claims = await verifySession(store, token, secret, nowMs)
  if (!claims) return null
  const nowS = sec(nowMs)
  if (nowS - claims.issuedAt < ROTATE_AFTER_SECONDS) return null
  if (claims.authTime + SESSION_MAX_SECONDS <= nowS) return null // past the cap: let it end
  const next = await issueSession(store, secret, { nowMs, authTime: claims.authTime })
  await store.expireAt(claims.sid, new Date((nowS + ROTATION_GRACE_SECONDS) * 1000).toISOString())
  return next
}

export function sessionCookieOptions(maxAge: number) {
  return { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/', maxAge }
}
