// SPDX-License-Identifier: GPL-3.0-or-later
// One-click deletion of a report everywhere it lives (a data-subject request,
// v1.5): its screenshot in Drive, its entry in the Drive archive it went into,
// and finally its database row. Drive goes first, so a failure there leaves the
// row in place to retry; every step tolerates "already gone", so a retry after
// a partial run finishes the job instead of failing on it.
//
// Every job that rewrites the Drive archives holds one lock (lib/lock.ts), so
// this never races the nightly archive or another deletion. As a second line,
// the row is only deleted while its archive_ref is still the one that was
// cleaned, and every archive dated between the report's creation and its
// archive_ref is checked — a run that died before marking its reports could
// have left a copy in an archive the row does not name.
import { removeReportFromZip, UnreadableArchiveError } from './zip'
import type { ReportRecord } from './db'

export type DsarDeps = {
  getReport: (id: number) => Promise<ReportRecord | null>
  deleteDriveFile: (fileId: string) => Promise<void>
  /** Every file in the archives folder. */
  listArchives: () => Promise<{ id: string; name: string }[]>
  downloadFile: (fileId: string) => Promise<Uint8Array>
  /** Upload a rewritten archive under the same name (retention goes by the name's date). */
  uploadArchive: (name: string, bytes: Uint8Array) => Promise<string>
  /** Delete the row only while its archive_ref is still ``archiveRef``; false otherwise. */
  deleteReportRow: (id: number, archiveRef: string | null) => Promise<boolean>
}

export type DsarError = 'not_found' | 'drive' | 'archive_unreadable' | 'busy'
export type DsarResult =
  | { ok: true; imageDeleted: boolean; archivesChanged: number }
  | { ok: false; error: DsarError }

const ATTEMPTS = 3
const gone = (e: unknown) => /-> 404\b/.test(String(e instanceof Error ? e.message : e))
const ARCHIVE_DAY = /^rosu-reports-(\d{8})\.zip$/

/** ``YYYYMMDD`` (UTC) of an ISO time, or of an archive's name. */
const dayOf = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10).replace(/-/g, '')
}

/** The archives that may hold report ``r``: the one it names, and every one
 *  dated from the day it was created to that one (or today, if none). */
export function archivesFor(r: Pick<ReportRecord, 'created_at' | 'archive_ref'>,
  files: { id: string; name: string }[], nowMs: number): { id: string; name: string }[] {
  const from = dayOf(r.created_at)
  const named = r.archive_ref ? ARCHIVE_DAY.exec(r.archive_ref)?.[1] : undefined
  const to = named ?? dayOf(new Date(nowMs).toISOString())
  return files.filter((f) => {
    if (r.archive_ref && f.name === r.archive_ref) return true
    const day = ARCHIVE_DAY.exec(f.name)?.[1]
    return day !== undefined && from !== '' && day >= from && day <= to
  })
}

export async function deleteReportEverywhere(deps: DsarDeps, id: number, nowMs = Date.now()): Promise<DsarResult> {
  let imageDeleted = false
  let archivesChanged = 0
  const cleanedImages = new Set<string>()
  const cleanedArchives = new Set<string>()
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const r = await deps.getReport(id)
    if (!r) {
      // Gone between attempts (deleted by another request): that is the goal.
      return attempt === 0 ? { ok: false, error: 'not_found' } : { ok: true, imageDeleted, archivesChanged }
    }
    try {
      // Whatever its status says, a screenshot id that is set may still exist.
      if (r.image_drive_id && !cleanedImages.has(r.image_drive_id)) {
        try { await deps.deleteDriveFile(r.image_drive_id); imageDeleted = true }
        catch (e) { if (!gone(e)) throw e }
        cleanedImages.add(r.image_drive_id)
      }
      {
        for (const a of archivesFor(r, await deps.listArchives(), nowMs)) {
          if (cleanedArchives.has(a.id)) continue
          let bytes: Uint8Array
          try { bytes = await deps.downloadFile(a.id) }
          catch (e) { if (gone(e)) { cleanedArchives.add(a.id); continue } throw e }
          const res = await removeReportFromZip(bytes, r.id, r.image_name)
          if (res.removed) {
            // Write the new archive before removing the old one: a failure in
            // between leaves both (the report still in one), never neither. A
            // file is not updated in place, because Drive would keep the old
            // content as a revision; a deleted file is gone at once (no trash).
            if (res.remaining > 0) await deps.uploadArchive(a.name, res.bytes)
            try { await deps.deleteDriveFile(a.id) } catch (e) { if (!gone(e)) throw e }
            archivesChanged++
          }
          cleanedArchives.add(a.id)
        }
      }
    } catch (e) {
      return { ok: false, error: e instanceof UnreadableArchiveError ? 'archive_unreadable' : 'drive' }
    }
    if (await deps.deleteReportRow(r.id, r.archive_ref)) return { ok: true, imageDeleted, archivesChanged }
    // The row changed under us (the nightly archive just took it): look again.
  }
  return { ok: false, error: 'busy' }
}

/** The id from a delete request's JSON body, or null. ``id`` and ``confirm``
 *  must both be the same positive integer (a number, or a string of digits). */
export function parseDsarRequest(body: unknown): number | null {
  if (typeof body !== 'object' || body === null) return null
  const d = body as Record<string, unknown>
  const int = (v: unknown) =>
    typeof v === 'number' ? v : typeof v === 'string' && /^\d{1,15}$/.test(v) ? Number(v) : NaN
  const id = int(d.id)
  if (!Number.isSafeInteger(id) || id <= 0 || int(d.confirm) !== id) return null
  return id
}
