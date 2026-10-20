// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminGuard'
import { parseStatusUpdate } from '@/lib/reportStatus'
import { insertAudit, setReportStatus } from '@/lib/db'
export const runtime = 'nodejs'

/** Set a report's public status (shown on the reporter's tracking page). */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  const parsed = parseStatusUpdate(await req.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })
  const v = parsed.value
  try {
    if (!(await setReportStatus(admin.sql, v.id, v))) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    await insertAudit(admin.sql, 'status_change', null, `#${v.id} → ${v.status}${v.fixed_in ? ` (${v.fixed_in})` : ''}`)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}
