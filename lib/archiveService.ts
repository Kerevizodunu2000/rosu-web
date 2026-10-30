// SPDX-License-Identifier: GPL-3.0-or-later
import { buildReportsZip } from './zip'
import type { ReportRecord } from './db'
export type ArchiveDeps = {
  listUnarchived: () => Promise<ReportRecord[]>
  downloadImage: (driveId: string) => Promise<Uint8Array>
  /** Upload a new archive; returns its Drive file id. */
  uploadArchive: (name: string, bytes: Uint8Array) => Promise<string>
  deleteArchive: (fileId: string) => Promise<void>
  /** Mark the still-unarchived ones among ``ids``; returns the ids it marked. */
  markArchived: (ids: number[], archiveName: string) => Promise<number[]>
  deleteImage: (driveId: string) => Promise<void>
}
/** The rewrite that takes vanished reports out of a new archive failed: the
 *  file named here may still hold their data and needs a look. */
export class ArchiveRewriteError extends Error {
  constructor(readonly archiveName: string, readonly fileId: string, readonly reports: number) {
    super(`archive ${archiveName} (${fileId}) still holds ${reports} deleted report(s)`)
  }
}

const REWRITE_TRIES = 3
const DOWNLOAD_TRIES = 3
/** An upload this young may still be running: leave the report for the next run. */
const UPLOAD_GRACE_MS = 60 * 60 * 1000

/** A network failure or a Drive 429/5xx: worth another try, never a reason to drop the image. */
const isTransient = (e: unknown) =>
  e instanceof TypeError || /-> (?:429|5\d\d)\b/.test(e instanceof Error ? e.message : String(e))

export async function runArchive(deps: ArchiveDeps, today: string, nowMs = Date.now()): Promise<{ archived: number; archiveName?: string }> {
  const listed = await deps.listUnarchived()
  const reports: ReportRecord[] = []
  const entries: { report: { id: number }; image?: { name: string; bytes: Uint8Array }; imageId?: string }[] = []
  for (const r of listed) {
    if (r.image_status === 'uploading' && nowMs - new Date(r.created_at).getTime() < UPLOAD_GRACE_MS) continue
    let image: { name: string; bytes: Uint8Array } | undefined
    let imageId: string | undefined
    if (r.image_status === 'stored' && r.image_drive_id && r.image_name) {
      let transient = false
      for (let i = 0; i < DOWNLOAD_TRIES; i++) {
        try {
          image = { name: r.image_name, bytes: await deps.downloadImage(r.image_drive_id) }
          imageId = r.image_drive_id
          transient = false
          break
        } catch (e) {
          // A permanent error (deleted in Drive, 403, ...) must not wedge the
          // nightly archive forever: archive the report's text without it.
          transient = isTransient(e)
          if (!transient) break
        }
      }
      // Drive still failing: keep the report and its image for the next run.
      if (transient) continue
    }
    reports.push(r)
    entries.push({ report: r as unknown as { id: number }, image, imageId })
  }
  if (!reports.length) return { archived: 0 }
  const archiveName = `rosu-reports-${today}.zip`
  const fileId = await deps.uploadArchive(archiveName, await buildReportsZip(entries))
  let marked: number[]
  try {
    marked = await deps.markArchived(reports.map((r) => r.id), archiveName)
  } catch (e) {
    // Unmarked reports are archived again by the next run: take this copy back,
    // so a report never sits in two archives (a deletion request finds one).
    try { await deps.deleteArchive(fileId) } catch { /* best effort */ }
    throw e
  }
  const kept = new Set(marked)
  const ours = entries.filter((e) => kept.has(e.report.id))
  for (const e of ours) {
    if (e.imageId) { try { await deps.deleteImage(e.imageId) } catch { /* best effort */ } }
  }
  if (ours.length < entries.length) {
    // Some reports were deleted (a data request) or archived by another run
    // while this ZIP was built: it must not keep a copy of them.
    // (A new file, then the old one deleted: an updated file would keep the
    // old content as a Drive revision.)
    let replacement: string | null = null
    let lastError: unknown = null
    for (let i = 0; i < REWRITE_TRIES; i++) {
      try {
        if (ours.length && replacement === null) replacement = await deps.uploadArchive(archiveName, await buildReportsZip(ours))
        await deps.deleteArchive(fileId)
        lastError = null
        break
      } catch (e) {
        if (/-> 404\b/.test(String(e instanceof Error ? e.message : e))) { lastError = null; break }
        lastError = e
      }
    }
    if (lastError !== null) throw new ArchiveRewriteError(archiveName, fileId, entries.length - ours.length)
  }
  return ours.length ? { archived: ours.length, archiveName } : { archived: 0 }
}
