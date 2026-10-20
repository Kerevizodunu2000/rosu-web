// SPDX-License-Identifier: GPL-3.0-or-later
// One-click deletion of a report everywhere it lives (a data-subject request,
// v1.5): its screenshot in Drive, its entry in the Drive archive it went into,
// and finally its database row. Drive goes first, so a failure there leaves the
// row in place to retry; every step tolerates "already gone", so a retry after
// a partial run finishes the job instead of failing on it.
import { removeReportFromZip } from './zip'
import type { ReportRecord } from './db'

export type DsarDeps = {
  getReport: (id: number) => Promise<ReportRecord | null>
  deleteDriveFile: (fileId: string) => Promise<void>
  findArchives: (name: string) => Promise<{ id: string; name: string }[]>
  downloadFile: (fileId: string) => Promise<Uint8Array>
  uploadArchive: (name: string, bytes: Uint8Array) => Promise<string>
  deleteReportRow: (id: number) => Promise<boolean>
}

export type DsarResult =
  | { ok: true; imageDeleted: boolean; archivesChanged: number }
  | { ok: false; error: 'not_found' | 'drive' }

const gone = (e: unknown) => /-> 404\b/.test(String(e instanceof Error ? e.message : e))

export async function deleteReportEverywhere(deps: DsarDeps, id: number): Promise<DsarResult> {
  const r = await deps.getReport(id)
  if (!r) return { ok: false, error: 'not_found' }
  let imageDeleted = false
  let archivesChanged = 0
  try {
    if (r.image_drive_id && r.image_status === 'stored') {
      try { await deps.deleteDriveFile(r.image_drive_id); imageDeleted = true }
      catch (e) { if (!gone(e)) throw e }
    }
    if (r.archive_ref) {
      for (const a of await deps.findArchives(r.archive_ref)) {
        const res = await removeReportFromZip(await deps.downloadFile(a.id), r.id, r.image_name)
        if (!res.removed) continue
        // Write the new archive before removing the old one: a failure in
        // between leaves both (the report still in one), never neither.
        if (res.remaining > 0) await deps.uploadArchive(a.name, res.bytes)
        try { await deps.deleteDriveFile(a.id) } catch (e) { if (!gone(e)) throw e }
        archivesChanged++
      }
    }
  } catch {
    return { ok: false, error: 'drive' }
  }
  await deps.deleteReportRow(r.id)
  return { ok: true, imageDeleted, archivesChanged }
}
