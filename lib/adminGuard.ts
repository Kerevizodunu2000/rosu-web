// SPDX-License-Identifier: GPL-3.0-or-later
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getDb, insertAdminSession, getLiveAdminSession, expireAdminSessionAt, type Sql } from './db'
import { SESSION_COOKIE, verifySession, type SessionClaims, type SessionStore } from './session'

export function sessionStore(sql: Sql, ipHash: string | null = null): SessionStore {
  return {
    insert: (v) => insertAdminSession(sql, { ...v, ipHash: ipHash ?? '' }),
    isLive: async (id) => (await getLiveAdminSession(sql, id)) !== null,
    expireAt: (id, at) => expireAdminSessionAt(sql, id, at),
  }
}

/** The signed-in admin for a server component (page), or null. Never throws. */
export async function currentAdmin(): Promise<{ claims: SessionClaims; sql: Sql } | null> {
  const secret = process.env.ADMIN_SESSION_SECRET || ''
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!secret || !token) return null
  try {
    const sql = await getDb()
    const claims = await verifySession(sessionStore(sql), token, secret)
    return claims ? { claims, sql } : null
  } catch { return null }
}

/**
 * Same-origin check for state-changing admin calls (defence in depth on top of
 * the SameSite=Strict cookie): a browser always sends Origin on a cross-site
 * POST, so a mismatch is refused.
 */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // same-origin GETs and non-browser clients omit it; the cookie still gates them
  try { return new URL(origin).host === req.headers.get('host') } catch { return false }
}

/** Gate for admin route handlers: returns the session + db, or the error response to send. */
export async function requireAdmin(req: NextRequest): Promise<{ claims: SessionClaims; sql: Sql } | NextResponse> {
  if (req.method !== 'GET' && !sameOrigin(req)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  const admin = await currentAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  return admin
}
