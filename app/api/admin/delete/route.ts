// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminGuard'
import { runDsarDelete } from '@/lib/archiveJob'
import { insertAudit, type Sql } from '@/lib/db'
import { parseDsarRequest } from '@/lib/dsar'
export const runtime = 'nodejs'
export const maxDuration = 60

// The audit keeps the id only — never the deleted content or contact. An audit
// write that fails must not turn a finished deletion into an error.
async function audit(sql: Sql, event: 'dsar_delete' | 'dsar_failed', detail: string) {
  try { await insertAudit(sql, event, null, detail) } catch { /* the deletion stands */ }
}

/**
 * Delete a report everywhere (a data-subject request): Drive screenshot, its
 * entry in the Drive archive, then the database row. The JSON body must repeat
 * the id as ``confirm`` — a guard against a stray or replayed click.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 415 })
  }
  const id = parseDsarRequest(await req.json().catch(() => null))
  if (id === null) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  let res
  try {
    res = await runDsarDelete(admin.sql, id)
  } catch {
    await audit(admin.sql, 'dsar_failed', `#${id}: server error`)
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
  if (!res.ok) {
    if (res.error !== 'not_found') await audit(admin.sql, 'dsar_failed', `#${id}: ${res.error}`)
    const status = res.error === 'not_found' ? 404 : res.error === 'busy' ? 409 : 502
    return NextResponse.json({ ok: false, error: res.error }, { status })
  }
  await audit(admin.sql, 'dsar_delete',
    `#${id} deleted (row${res.imageDeleted ? ', screenshot' : ''}${res.archivesChanged ? `, ${res.archivesChanged} archive(s)` : ''})`)
  return NextResponse.json(res)
}
