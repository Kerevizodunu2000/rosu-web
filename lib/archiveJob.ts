// SPDX-License-Identifier: GPL-3.0-or-later
import { runArchive } from './archiveService'
import { runRetention } from './retention'
import { deleteReportEverywhere, type DsarResult } from './dsar'
import { DriveClient } from './drive'
import {
  getDb, listUnarchived, markArchived, pruneRateEvents, purgeArchivedReportsBefore,
  purgeCrashesBefore, purgeAuditBefore, purgeAdminSessions, purgeTotpSteps, insertAudit,
  listReportById, deleteReportRow, type Sql,
} from './db'
import { requireEnv } from './env'

function driveFromEnv(): DriveClient {
  return new DriveClient({
    clientId: requireEnv('GOOGLE_OAUTH_CLIENT_ID'),
    clientSecret: requireEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
    refreshToken: requireEnv('GOOGLE_REFRESH_TOKEN'),
  })
}
const rootName = () => process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'Rosu Reports'

/**
 * Bundle all unarchived reports (+ their images) into a dated ZIP in the
 * owner's Drive, mark them archived, and prune stale rate-limit rows. Shared by
 * the daily cron and the admin "Archive now" button. Kept in lib/ (not exported
 * from a route module) so the two routes don't cross-import and the route files
 * keep to their handler-only export contract.
 */
export async function runArchiveJob(): Promise<{ archived: number; archiveName?: string }> {
  const sql = await getDb()
  const drive = driveFromEnv()
  const d = new Date()
  const today = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`

  const pruneRate = async () => {
    // Keep rate_events from growing without bound (it was never pruned). Windows
    // are minute/day and the login lockout looks back 30 minutes, so retaining 2
    // days is safe. Runs even when the archive itself fails: /privacy promises
    // hashed IPs are gone after two days whatever else happens.
    await pruneRateEvents(sql, new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString())
  }
  let result: { archived: number; archiveName?: string }
  try {
    result = await runArchive({
    listUnarchived: () => listUnarchived(sql),
    downloadImage: (id) => drive.downloadFile(id),
    uploadArchive: async (name, bytes) => {
      const root = await drive.ensureFolder(rootName())
      const archives = await drive.ensureFolder('Archives', root)
      return drive.uploadFile({ name, mimeType: 'application/zip', bytes, parent: archives })
    },
    markArchived: (ids, ref) => markArchived(sql, ids, ref),
    deleteImage: (id) => drive.deleteFile(id),
  }, today)
  } finally {
    await pruneRate()
  }
  return result
}

/** The 12-month retention sweep (see lib/retention.ts). */
export async function runRetentionJob(): Promise<{ archivesDeleted: number; reportsDeleted: number; failures: number }> {
  const sql = await getDb()
  const drive = driveFromEnv()
  const result = await runRetention({
    listArchives: async () => {
      const root = await drive.ensureFolder(rootName())
      return drive.listFolder(await drive.ensureFolder('Archives', root))
    },
    deleteArchive: (id) => drive.deleteFile(id),
    purgeReports: (before) => purgeArchivedReportsBefore(sql, before),
    purgeCrashes: (before) => purgeCrashesBefore(sql, before),
    purgeAudit: (before) => purgeAuditBefore(sql, before),
    purgeEphemeral: async (nowMs) => {
      await purgeAdminSessions(sql, new Date(nowMs - 24 * 60 * 60 * 1000).toISOString())
      await purgeTotpSteps(sql, new Date(nowMs - 10 * 60 * 1000).toISOString())
    },
  })
  if (result.archivesDeleted || result.reportsDeleted || result.failures) {
    await insertAudit(sql, 'maintenance', null,
      `retention: ${result.archivesDeleted} archive(s), ${result.reportsDeleted} report row(s) deleted` +
      (result.failures ? `, ${result.failures} archive deletion(s) failed` : ''))
  }
  return result
}

/** The DSAR delete (lib/dsar.ts) wired to the real Drive folder layout. */
export async function runDsarDelete(sql: Sql, id: number): Promise<DsarResult> {
  const drive = driveFromEnv()
  const archivesFolder = async () => drive.ensureFolder('Archives', await drive.ensureFolder(rootName()))
  return deleteReportEverywhere({
    getReport: (rid) => listReportById(sql, rid),
    deleteDriveFile: (fileId) => drive.deleteFile(fileId),
    findArchives: async (name) => (await drive.listFolder(await archivesFolder())).filter((f) => f.name === name),
    downloadFile: (fileId) => drive.downloadFile(fileId),
    uploadArchive: async (name, bytes) =>
      drive.uploadFile({ name, mimeType: 'application/zip', bytes, parent: await archivesFolder() }),
    deleteReportRow: (rid) => deleteReportRow(sql, rid),
  }, id)
}
