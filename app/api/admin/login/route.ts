// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { handleLogin } from '@/lib/adminAuth'
import { SESSION_COOKIE, issueSession, sessionCookieOptions } from '@/lib/session'
import { hashIp } from '@/lib/crypto'
import { clientIp } from '@/lib/net'
import { checkRateLimit, LOGIN_LIMITS } from '@/lib/ratelimit'
import { sameOrigin, sessionStore } from '@/lib/adminGuard'
import { getDb, countEventsSince, countAllEventsSince, recordRateEvent, loginFailuresSince, claimTotpStep, insertAudit } from '@/lib/db'
import { requireEnv } from '@/lib/env'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  try {
    const sql = await getDb()
    const ipHash = hashIp('login:' + clientIp(req), requireEnv('IP_HASH_SALT'))
    const secret = requireEnv('ADMIN_SESSION_SECRET')
    const body = await req.json().catch(() => ({})) as { password?: unknown; code?: unknown }
    const result = await handleLogin({ password: body?.password, code: body?.code }, {
      adminPassword: process.env.ADMIN_PASSWORD || '',
      totpSecret: process.env.ADMIN_TOTP_SECRET || '',
      checkRateLimit: () => checkRateLimit(ipHash, {
        countEventsSince: (h, s) => countEventsSince(sql, h, s, 'login'),
        countAllEventsSince: (s) => countAllEventsSince(sql, s, 'login'),
        recordRateEvent: (h) => recordRateEvent(sql, h, 'login'),
      }, Date.now(), LOGIN_LIMITS),
      failuresSince: (since) => loginFailuresSince(sql, ipHash, since),
      claimTotpStep: (step) => claimTotpStep(sql, step),
      audit: (event, detail) => insertAudit(sql, event, ipHash, detail ?? null),
      startSession: () => issueSession(sessionStore(sql, ipHash), secret),
    })
    const res = NextResponse.json(result.body, { status: result.status })
    if (result.body.retry_after) res.headers.set('Retry-After', String(result.body.retry_after))
    if (result.session) res.cookies.set(SESSION_COOKIE, result.session.token, sessionCookieOptions(result.session.maxAge))
    return res
  } catch {
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}
