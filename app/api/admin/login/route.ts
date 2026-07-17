// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { passwordOk } from '@/lib/adminAuth'
import { createSession, SESSION_COOKIE } from '@/lib/session'
export const runtime = 'nodejs'
export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: '' }))
  if (!passwordOk(String(password || ''), process.env.ADMIN_PASSWORD || ''))
    return NextResponse.json({ ok: false }, { status: 401 })
  const token = await createSession(process.env.ADMIN_SESSION_SECRET!)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 })
  return res
}
