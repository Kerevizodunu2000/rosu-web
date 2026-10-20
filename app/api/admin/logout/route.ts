// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/session'
import { requireAdmin } from '@/lib/adminGuard'
import { insertAudit, revokeAdminSession, revokeAllAdminSessions } from '@/lib/db'
import { hashIp } from '@/lib/crypto'
import { clientIp } from '@/lib/net'
export const runtime = 'nodejs'

/** End this session, or with {"all": true} every admin session ("sign out everywhere"). */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', sessionCookieOptions(0))
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return res // no live session: just clear the cookie
  const body = await req.json().catch(() => ({})) as { all?: unknown }
  const ipHash = hashIp('login:' + clientIp(req), process.env.IP_HASH_SALT || '')
  try {
    if (body?.all === true) {
      const n = await revokeAllAdminSessions(admin.sql)
      await insertAudit(admin.sql, 'logout_all', ipHash, `revoked=${n}`)
    } else {
      await revokeAdminSession(admin.sql, admin.claims.sid)
      await insertAudit(admin.sql, 'logout', ipHash)
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
  return res
}
