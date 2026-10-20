// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminGuard'
import { runArchiveJob } from '@/lib/archiveJob'
import { insertAudit } from '@/lib/db'
export const runtime = 'nodejs'
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  try {
    const result = await runArchiveJob()
    await insertAudit(admin.sql, 'archive', null, `archived=${result.archived}${result.archiveName ? ` → ${result.archiveName}` : ''}`)
    return NextResponse.json({ ok: true, ...result })
  } catch {
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}
