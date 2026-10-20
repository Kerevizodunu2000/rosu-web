// SPDX-License-Identifier: GPL-3.0-or-later
import { NextResponse } from 'next/server'
import { dbHealth } from '@/lib/health'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** For uptime monitors: 200 when everything answers, 503 when the database does not. */
export async function GET() {
  const db = await dbHealth()
  return NextResponse.json({ ok: db === 'ok', db },
    { status: db === 'ok' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
