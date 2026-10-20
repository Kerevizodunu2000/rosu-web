// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { runArchiveJob, runRetentionJob } from '@/lib/archiveJob'
import { constantTimeEqual } from '@/lib/crypto'
import { ping, pingUrl } from '@/lib/watchdog'
export const runtime = 'nodejs'

/** Nightly: archive new reports → enforce 12-month retention → ping the watchdog. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') || ''
  if (!secret || !constantTimeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ ok: false }, { status: 401 })
  const hc = pingUrl()
  try {
    const archive = await runArchiveJob()
    const retention = await runRetentionJob()
    await ping(hc, 'success', `archived=${archive.archived} archivesDeleted=${retention.archivesDeleted} reportsDeleted=${retention.reportsDeleted}`)
    return NextResponse.json({ ok: true, ...archive, retention })
  } catch (e) {
    await ping(hc, 'fail', e instanceof Error ? e.message : 'nightly job failed')
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}
