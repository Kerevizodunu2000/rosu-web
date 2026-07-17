// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { runArchiveJob } from '@/lib/archiveJob'
import { constantTimeEqual } from '@/lib/crypto'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') || ''
  if (!secret || !constantTimeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({ ok: true, ...(await runArchiveJob()) })
}
