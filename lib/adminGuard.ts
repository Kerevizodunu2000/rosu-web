// SPDX-License-Identifier: GPL-3.0-or-later
import { NextResponse, type NextRequest } from 'next/server'
import { cookies, headers } from 'next/headers'
import { getDb, insertAdminSession, getLiveAdminSession, claimAdminSessionRotation, type Sql } from './db'
import { SESSION_COOKIE, verifySession, type SessionClaims, type SessionStore } from './session'
import { GATE_HEADER, gateOk } from './adminPath'

export function sessionStore(sql: Sql, ipHash: string | null = null): SessionStore {
  return {
    insert: (v) => insertAdminSession(sql, { ...v, ipHash: ipHash ?? '' }),
    isLive: async (id) => (await getLiveAdminSession(sql, id)) !== null,
    claimRotation: (id, until) => claimAdminSessionRotation(sql, id, until),
  }
}

export type AdminLookup =
  | { ok: true; claims: SessionClaims; sql: Sql }
  | { ok: false; reason: 'hidden' | 'none' | 'error' }

/** Resolve the signed-in admin; distinguishes "not signed in" from "database down". */
export async function lookupAdmin(): Promise<AdminLookup> {
  if (!gateOk((await headers()).get(GATE_HEADER))) return { ok: false, reason: 'hidden' }
  const secret = process.env.ADMIN_SESSION_SECRET || ''
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!secret || !token) return { ok: false, reason: 'none' }
  try {
    const sql = await getDb()
    const claims = await verifySession(sessionStore(sql), token, secret)
    return claims ? { ok: true, claims, sql } : { ok: false, reason: 'none' }
  } catch {
    return { ok: false, reason: 'error' }
  }
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

/**
 * Gate for admin route handlers: the session + db, or the response to send —
 * 404 when the secret path is not in use for this request, 403 cross-origin,
 * 401 without a live session, 503 when the database cannot be reached (so an
 * action like "sign out everywhere" never silently reports success).
 */
export async function requireAdmin(req: NextRequest): Promise<{ claims: SessionClaims; sql: Sql } | NextResponse> {
  if (!gateOk(req.headers.get(GATE_HEADER))) return new NextResponse('not found', { status: 404 })
  if (req.method !== 'GET' && !sameOrigin(req)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  const admin = await lookupAdmin()
  if (admin.ok) return { claims: admin.claims, sql: admin.sql }
  if (admin.reason === 'error') return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 })
  if (admin.reason === 'hidden') return new NextResponse('not found', { status: 404 })
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
}
