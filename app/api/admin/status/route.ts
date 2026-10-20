// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminGuard'
import { parseBulkStatusUpdate, parseStatusUpdate } from '@/lib/reportStatus'
import { insertAudit, setReportStatus, setReportStatusMany } from '@/lib/db'
export const runtime = 'nodejs'

/**
 * Set a report's public status (shown on the reporter's tracking page) — or,
 * with ``ids`` instead of ``id``, the same status for up to 100 reports.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  const body = await req.json().catch(() => null)
  try {
    if (body && typeof body === 'object' && 'ids' in body) {
      const parsed = parseBulkStatusUpdate(body)
      if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })
      const v = parsed.value
      const updated = await setReportStatusMany(admin.sql, v.ids, v)
      if (updated.length) {
        const shown = updated.slice(0, 20).map((n) => `#${n}`).join(', ') + (updated.length > 20 ? ', …' : '')
        await insertAudit(admin.sql, 'status_change', null,
          `${shown} → ${v.status}${v.fixed_in ? ` (${v.fixed_in})` : ''}`)
      }
      return NextResponse.json({ ok: true, updated: updated.length })
    }
    const parsed = parseStatusUpdate(body)
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 })
    const v = parsed.value
    if (!(await setReportStatus(admin.sql, v.id, v))) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    await insertAudit(admin.sql, 'status_change', null, `#${v.id} → ${v.status}${v.fixed_in ? ` (${v.fixed_in})` : ''}`)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}
