// SPDX-License-Identifier: GPL-3.0-or-later
// Enforces the 12-month retention promised on /privacy: archive ZIPs in Drive,
// archived report rows, crash data and the admin audit log older than twelve
// months are deleted by the nightly job.

export const RETENTION_MONTHS = 12
const ARCHIVE_RE = /^rosu-reports-(\d{4})(\d{2})(\d{2})\.zip$/

/** The instant before which data is past retention (calendar months, UTC). */
export function retentionCutoff(nowMs: number, months = RETENTION_MONTHS): Date {
  const d = new Date(nowMs)
  d.setUTCMonth(d.getUTCMonth() - months)
  return d
}

export type DriveEntry = { id: string; name: string; createdTime?: string }

/**
 * Archive ZIPs whose newest possible content is older than the cutoff. Only
 * files named like our own archives are ever candidates — anything else in the
 * folder is left alone. An archive dated D holds reports created up to the end
 * of D, so it goes only once that whole day (and its Drive creation time, when
 * known) is before the cutoff.
 */
export function expiredArchives(files: DriveEntry[], cutoff: Date): DriveEntry[] {
  return files.filter((f) => {
    const m = ARCHIVE_RE.exec(f.name)
    if (!m) return false
    const endOfDay = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 1)
    if (!Number.isFinite(endOfDay) || endOfDay > cutoff.getTime()) return false
    if (f.createdTime) {
      const created = Date.parse(f.createdTime)
      if (!Number.isFinite(created) || created > cutoff.getTime()) return false
    }
    return true
  })
}

export type RetentionDeps = {
  listArchives: () => Promise<DriveEntry[]>
  deleteArchive: (id: string) => Promise<void>
  purgeReports: (beforeIso: string) => Promise<number>
  purgeCrashes: (beforeIso: string) => Promise<void>
  purgeAudit: (beforeIso: string) => Promise<void>
  /** Short-lived housekeeping (expired sessions, used TOTP steps) — not retention-bound. */
  purgeEphemeral: (nowMs: number) => Promise<void>
}

/**
 * Every purge runs on its own: a Drive outage must not stop the database
 * purges (or the other way round). ``failures`` counts what did not complete;
 * the cron reports a run with failures to the watchdog as failed.
 */
export async function runRetention(deps: RetentionDeps, nowMs = Date.now()):
  Promise<{ archivesDeleted: number; reportsDeleted: number; failures: number }> {
  const cutoff = retentionCutoff(nowMs)
  const beforeIso = cutoff.toISOString()
  let archivesDeleted = 0, reportsDeleted = 0, failures = 0
  try {
    for (const f of expiredArchives(await deps.listArchives(), cutoff)) {
      try { await deps.deleteArchive(f.id); archivesDeleted++ } catch { failures++ }
    }
  } catch { failures++ }
  try { reportsDeleted = await deps.purgeReports(beforeIso) } catch { failures++ }
  for (const step of [() => deps.purgeCrashes(beforeIso), () => deps.purgeAudit(beforeIso),
                      () => deps.purgeEphemeral(nowMs)]) {
    try { await step() } catch { failures++ }
  }
  return { archivesDeleted, reportsDeleted, failures }
}
