// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySession } from '@/lib/session'
import { runArchiveJob } from '@/lib/archiveJob'
export const runtime = 'nodejs'
export async function POST(_req: NextRequest) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!(await verifySession(token, process.env.ADMIN_SESSION_SECRET!))) return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({ ok: true, ...(await runArchiveJob()) })
}
