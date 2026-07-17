// SPDX-License-Identifier: GPL-3.0-or-later
import { buildReportsZip } from './zip'
import type { ReportRecord } from './db'
export type ArchiveDeps = {
  listUnarchived: () => Promise<ReportRecord[]>
  downloadImage: (driveId: string) => Promise<Uint8Array>
  uploadArchive: (name: string, bytes: Uint8Array) => Promise<string>
  markArchived: (ids: number[], archiveName: string) => Promise<void>
  deleteImage: (driveId: string) => Promise<void>
}
export async function runArchive(deps: ArchiveDeps, today: string): Promise<{ archived: number; archiveName?: string }> {
  const reports = await deps.listUnarchived()
  if (!reports.length) return { archived: 0 }
  const entries = []
  const toDelete: string[] = []
  for (const r of reports) {
    let image: { name: string; bytes: Uint8Array } | undefined
    if (r.image_status === 'stored' && r.image_drive_id && r.image_name) {
      try {
        image = { name: r.image_name, bytes: await deps.downloadImage(r.image_drive_id) }
        toDelete.push(r.image_drive_id)
      } catch {
        // A single unreadable image (deleted in Drive, or a transient error) must
        // not wedge the whole nightly archive forever — archive the report's text
        // without it and move on.
        image = undefined
      }
    }
    entries.push({ report: r as unknown as { id: number }, image })
  }
  const archiveName = `rosu-reports-${today}.zip`
  const zip = await buildReportsZip(entries)
  await deps.uploadArchive(archiveName, zip)
  await deps.markArchived(reports.map((r) => r.id), archiveName)
  for (const id of toDelete) { try { await deps.deleteImage(id) } catch { /* best effort */ } }
  return { archived: reports.length, archiveName }
}
