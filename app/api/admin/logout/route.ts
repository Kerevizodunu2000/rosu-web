// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/session'
import { requireAdmin } from '@/lib/adminGuard'
import { insertAudit, revokeAdminSessionFamily, revokeAllAdminSessions } from '@/lib/db'
import { hashIp } from '@/lib/crypto'
import { rateIp } from '@/lib/net'
export const runtime = 'nodejs'

/**
 * End this sign-in (every session rotated from it), or with {"all": true} every
 * admin session ("sign out everywhere"). A database failure is reported (503),
 * never answered with a reassuring "ok".
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) {
    if (admin.status !== 401) return admin
    // No live session: just make sure the browser forgets the cookie.
    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0))
    return res
  }
  const body = await req.json().catch(() => ({})) as { all?: unknown }
  try {
    // Signing out always revokes; without a salt the audit row gets no IP hash (never an empty-salt one).
    const salt = process.env.IP_HASH_SALT
    const ipHash = salt ? hashIp('login:' + rateIp(req), salt) : null
    if (body?.all === true) {
      const n = await revokeAllAdminSessions(admin.sql)
      await insertAudit(admin.sql, 'logout_all', ipHash, `revoked=${n}`)
    } else {
      await revokeAdminSessionFamily(admin.sql, admin.claims.family)
      await insertAudit(admin.sql, 'logout', ipHash)
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0))
  return res
}
