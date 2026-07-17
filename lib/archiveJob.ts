// SPDX-License-Identifier: GPL-3.0-or-later
import { runArchive } from './archiveService'
import { DriveClient } from './drive'
import { getSql, listUnarchived, markArchived, pruneRateEvents } from './db'
import { requireEnv } from './env'

/**
 * Bundle all unarchived reports (+ their images) into a dated ZIP in the
 * owner's Drive, mark them archived, and prune stale rate-limit rows. Shared by
 * the daily cron and the admin "Archive now" button. Kept in lib/ (not exported
 * from a route module) so the two routes don't cross-import and the route files
 * keep to their handler-only export contract.
 */
export async function runArchiveJob(): Promise<{ archived: number; archiveName?: string }> {
  const sql = getSql()
  const drive = new DriveClient({
    clientId: requireEnv('GOOGLE_OAUTH_CLIENT_ID'),
    clientSecret: requireEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
    refreshToken: requireEnv('GOOGLE_REFRESH_TOKEN'),
  })
  const rootName = process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'Rosu Reports'
  const d = new Date()
  const today = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`

  const result = await runArchive({
    listUnarchived: () => listUnarchived(sql),
    downloadImage: (id) => drive.downloadFile(id),
    uploadArchive: async (name, bytes) => {
      const root = await drive.ensureFolder(rootName)
      const archives = await drive.ensureFolder('Archives', root)
      return drive.uploadFile({ name, mimeType: 'application/zip', bytes, parent: archives })
    },
    markArchived: (ids, ref) => markArchived(sql, ids, ref),
    deleteImage: (id) => drive.deleteFile(id),
  }, today)

  // Keep rate_events from growing without bound (it was never pruned). Windows
  // are minute/day, so retaining 2 days is safe; the created_at index makes both
  // this delete and the global count cheap.
  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  await pruneRateEvents(sql, cutoff)

  return result
}
