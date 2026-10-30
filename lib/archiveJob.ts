// SPDX-License-Identifier: GPL-3.0-or-later
import { ArchiveRewriteError, runArchive } from './archiveService'
import { runRetention } from './retention'
import { deleteReportEverywhere, type DsarResult } from './dsar'
import { DriveClient } from './drive'
import {
  getDb, listUnarchived, markArchived, pruneRateEvents, purgeArchivedReportsBefore,
  purgeCrashesBefore, purgeAuditBefore, purgeAdminSessions, purgeTotpSteps, insertAudit,
  listReportById, deleteReportRow, acquireJobLock, releaseJobLock, type Sql,
} from './db'
import { requireEnv } from './env'
import { DRIVE_ARCHIVES_LOCK, LockBusyError, withLock, type LockStore } from './lock'

const lockStore = (sql: Sql): LockStore => ({
  acquire: (name, holder, ttl) => acquireJobLock(sql, name, holder, ttl),
  release: (name, holder) => releaseJobLock(sql, name, holder),
})
// The jobs that rewrite archives wait their turn for up to ~30 s (a deletion
// request takes seconds); a request from the admin page waits less.
const JOB_WAIT = { attempts: 10, waitMs: 3000 }

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
  let failed = false
  try {
    // Built inside the try, so missing Drive settings still prune below.
    const drive = driveFromEnv()
    result = await withLock(lockStore(sql), DRIVE_ARCHIVES_LOCK, () => runArchive({
    listUnarchived: () => listUnarchived(sql),
    downloadImage: (id) => drive.downloadFile(id),
    uploadArchive: async (name, bytes) => {
      const root = await drive.ensureFolder(rootName())
      const archives = await drive.ensureFolder('Archives', root)
      return drive.uploadFile({ name, mimeType: 'application/zip', bytes, parent: archives })
    },
    deleteArchive: (fileId) => drive.deleteFile(fileId),
    markArchived: (ids, ref) => markArchived(sql, ids, ref),
    deleteImage: (id) => drive.deleteFile(id),
  }, today), JOB_WAIT)
  } catch (e) {
    failed = true
    if (e instanceof ArchiveRewriteError) {
      // Leave a trail the admin sees: this file needs a manual look in Drive.
      try { await insertAudit(sql, 'maintenance', null, `archive: ${e.message} — remove it by hand`) } catch { /* reported by the cron */ }
    }
    throw e
  } finally {
    // The archive's own error matters more than a prune error.
    try { await pruneRate() } catch (e) { if (!failed) throw e }
  }
  return result
}

/** The 12-month retention sweep (see lib/retention.ts). */
export async function runRetentionJob(): Promise<{ archivesDeleted: number; reportsDeleted: number; failures: number }> {
  const sql = await getDb()
  const drive = driveFromEnv()
  const result = await withLock(lockStore(sql), DRIVE_ARCHIVES_LOCK, () => runRetention({
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
  }), JOB_WAIT)
  if (result.archivesDeleted || result.reportsDeleted || result.failures) {
    await insertAudit(sql, 'maintenance', null,
      `retention: ${result.archivesDeleted} archive(s), ${result.reportsDeleted} report row(s) deleted` +
      (result.failures ? `, ${result.failures} archive deletion(s) failed` : ''))
  }
  return result
}

/** The DSAR delete (lib/dsar.ts) wired to the real Drive folder layout. The
 *  Drive client is only built when a step needs it, so a report with nothing
 *  in Drive can be deleted even while the Drive settings are missing. */
export async function runDsarDelete(sql: Sql, id: number): Promise<DsarResult> {
  let client: DriveClient | null = null
  const drive = () => (client ??= driveFromEnv())
  const archivesFolder = async () => drive().ensureFolder('Archives', await drive().ensureFolder(rootName()))
  try {
    return await withLock(lockStore(sql), DRIVE_ARCHIVES_LOCK, () => deleteReportEverywhere({
    getReport: (rid) => listReportById(sql, rid),
    deleteDriveFile: (fileId) => drive().deleteFile(fileId),
    listArchives: async () => drive().listFolder(await archivesFolder()),
    downloadFile: (fileId) => drive().downloadFile(fileId),
    uploadArchive: async (name, bytes) =>
      drive().uploadFile({ name, mimeType: 'application/zip', bytes, parent: await archivesFolder() }),
    deleteReportRow: (rid, ref) => deleteReportRow(sql, rid, ref),
  }, id), { attempts: 3, waitMs: 2000 })
  } catch (e) {
    if (e instanceof LockBusyError) return { ok: false, error: 'busy' }
    throw e
  }
}
