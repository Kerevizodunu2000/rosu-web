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
  const errors: string[] = []
  // The two halves are independent: a failed archive must not skip retention.
  let archive: { archived: number; archiveName?: string } = { archived: 0 }
  try { archive = await runArchiveJob() } catch (e) {
    errors.push('archive: ' + (e instanceof Error ? e.message : 'failed'))
  }
  let retention = { archivesDeleted: 0, reportsDeleted: 0, failures: 0 }
  try { retention = await runRetentionJob() } catch (e) {
    errors.push('retention: ' + (e instanceof Error ? e.message : 'failed'))
  }
  if (retention.failures) errors.push(`retention: ${retention.failures} step(s) failed`)
  const summary = `archived=${archive.archived} archivesDeleted=${retention.archivesDeleted} reportsDeleted=${retention.reportsDeleted}`
  await ping(hc, errors.length ? 'fail' : 'success', errors.length ? `${summary}\n${errors.join('\n')}` : summary)
  if (errors.length) return NextResponse.json({ ok: false, error: 'server', ...archive, retention }, { status: 500 })
  return NextResponse.json({ ok: true, ...archive, retention })
}
