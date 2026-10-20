// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminGuard'
import { runDsarDelete } from '@/lib/archiveJob'
import { insertAudit } from '@/lib/db'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Delete a report everywhere (a data-subject request): Drive screenshot, its
 * entry in the Drive archive, then the database row. The body must repeat the
 * id as ``confirm`` — a guard against a stray or replayed click.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  const body = (await req.json().catch(() => null)) as { id?: unknown; confirm?: unknown } | null
  const id = Number(body?.id)
  if (!Number.isSafeInteger(id) || id <= 0 || Number(body?.confirm) !== id) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }
  try {
    const res = await runDsarDelete(admin.sql, id)
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: res.error === 'not_found' ? 404 : 502 })
    }
    // The audit keeps the id only — never the deleted content or contact.
    await insertAudit(admin.sql, 'dsar_delete', null,
      `#${id} deleted (row${res.imageDeleted ? ', screenshot' : ''}${res.archivesChanged ? `, ${res.archivesChanged} archive(s)` : ''})`)
    return NextResponse.json(res)
  } catch {
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}
