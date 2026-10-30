// SPDX-License-Identifier: GPL-3.0-or-later
import { neon } from '@neondatabase/serverless'
import { ensureSchema } from './schema'
import type { RateLimits, RateReason } from './ratelimit'

export type ReportStatus = 'received' | 'in_review' | 'fixed' | 'closed'
export const REPORT_STATUSES: readonly ReportStatus[] = ['received', 'in_review', 'fixed', 'closed']

export type ReportRecord = {
  id: number; created_at: string; source: 'app' | 'web'
  title: string; description: string; contact: string | null
  app_version: string | null; os: string | null; lang: string | null; ip_hash: string | null
  image_status: 'none' | 'uploading' | 'stored' | 'archived' | 'error'
  image_drive_id: string | null; image_name: string | null; image_mime: string | null; image_original_name: string | null
  archive_ref: string | null; archived_at: string | null
  status: ReportStatus; status_note: string | null; fixed_in: string | null; status_updated_at: string | null
}
export type Sql = ReturnType<typeof neon>

let _sql: Sql | null = null
export function getSql(): Sql {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    _sql = neon(url)
  }
  return _sql
}

/** The query function, with the schema guaranteed current (migrates once per instance). */
export async function getDb(): Promise<Sql> {
  const sql = getSql()
  await ensureSchema(sql)
  return sql
}

// ── reports ───────────────────────────────────────────────────────────────────

export async function insertReport(sql: Sql, r: {
  source: string; title: string; description: string; contact: string
  app_version: string; os: string; lang: string; ip_hash: string; status_token_hash?: string
  image_status?: 'none' | 'uploading'
}): Promise<{ id: number }> {
  const rows = await sql`
    INSERT INTO reports (source, title, description, contact, app_version, os, lang, ip_hash, status_token_hash, image_status)
    VALUES (${r.source}, ${r.title}, ${r.description}, ${r.contact}, ${r.app_version}, ${r.os}, ${r.lang}, ${r.ip_hash},
            ${r.status_token_hash ?? null}, ${r.image_status ?? 'none'})
    RETURNING id` as { id: number }[]
  return { id: Number(rows[0].id) }
}

export async function setReportImage(sql: Sql, id: number, v: {
  image_status: string; image_drive_id?: string; image_name?: string; image_mime?: string; image_original_name?: string
}): Promise<void> {
  await sql`UPDATE reports SET image_status = ${v.image_status},
    image_drive_id = ${v.image_drive_id ?? null}, image_name = ${v.image_name ?? null},
    image_mime = ${v.image_mime ?? null}, image_original_name = ${v.image_original_name ?? null} WHERE id = ${id} AND archived_at IS NULL`
}

const iso = (v: unknown): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : String(v)
function normalizeReport(row: Record<string, unknown>): ReportRecord {
  // Never hand the tracking-token hash to callers (it ends up in admin props and archives).
  const { status_token_hash: _omit, ...rest } = row
  void _omit
  return { ...(rest as ReportRecord), id: Number(row.id),
    created_at: iso(row.created_at) as string, archived_at: iso(row.archived_at),
    status_updated_at: iso(row.status_updated_at),
    status: (row.status as ReportStatus) ?? 'received' }
}

export async function listRecentUnarchived(sql: Sql, limit: number): Promise<ReportRecord[]> {
  const rows = await sql`SELECT * FROM reports WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT ${limit}` as Record<string, unknown>[]
  return rows.map(normalizeReport)
}
export async function listRecentAll(sql: Sql, limit: number): Promise<ReportRecord[]> {
  const rows = await sql`SELECT * FROM reports ORDER BY created_at DESC LIMIT ${limit}` as Record<string, unknown>[]
  return rows.map(normalizeReport)
}
/**
 * One page of the admin list (v1.5): optional text search (title, description,
 * contact or the exact id), status, source and unarchived-only filters. One
 * static statement — the filters are bound parameters that are simply NULL
 * when unused. ``pattern`` comes from adminQuery.likePattern, whose backslash
 * escapes are ILIKE's default escape character. Returns the page plus the
 * total number of matches.
 */
export async function searchReports(sql: Sql, f: {
  unarchivedOnly: boolean; pattern: string | null; exactId: number | null
  status: ReportStatus | null; source: 'app' | 'web' | null; limit: number; offset: number
}): Promise<{ rows: ReportRecord[]; total: number }> {
  const [rows, count] = await Promise.all([
    sql`SELECT * FROM reports
      WHERE (${f.unarchivedOnly}::boolean IS NOT TRUE OR archived_at IS NULL)
        AND (${f.status}::text IS NULL OR status = ${f.status})
        AND (${f.source}::text IS NULL OR source = ${f.source})
        AND (${f.pattern}::text IS NULL OR title ILIKE ${f.pattern}
             OR description ILIKE ${f.pattern} OR contact ILIKE ${f.pattern}
             OR id = ${f.exactId})
      ORDER BY created_at DESC, id DESC LIMIT ${f.limit} OFFSET ${f.offset}`,
    sql`SELECT count(*)::int AS n FROM reports
      WHERE (${f.unarchivedOnly}::boolean IS NOT TRUE OR archived_at IS NULL)
        AND (${f.status}::text IS NULL OR status = ${f.status})
        AND (${f.source}::text IS NULL OR source = ${f.source})
        AND (${f.pattern}::text IS NULL OR title ILIKE ${f.pattern}
             OR description ILIKE ${f.pattern} OR contact ILIKE ${f.pattern}
             OR id = ${f.exactId})`,
  ]) as [Record<string, unknown>[], { n: number }[]]
  return { rows: rows.map(normalizeReport), total: Number(count[0]?.n ?? 0) }
}
/** How many reports are in each status, within the other filters (view,
 *  text, source) — so the status menu's numbers match what picking one shows.
 *  With no filters, the whole table. */
export async function statusCounts(sql: Sql, f: {
  unarchivedOnly: boolean; pattern?: string | null; exactId?: number | null; source?: 'app' | 'web' | null
} = { unarchivedOnly: false }): Promise<Record<ReportStatus, number>> {
  const pattern = f.pattern ?? null, exactId = f.exactId ?? null, source = f.source ?? null
  const rows = await sql`SELECT status, count(*)::int AS n FROM reports
    WHERE (${f.unarchivedOnly}::boolean IS NOT TRUE OR archived_at IS NULL)
      AND (${source}::text IS NULL OR source = ${source})
      AND (${pattern}::text IS NULL OR title ILIKE ${pattern}
           OR description ILIKE ${pattern} OR contact ILIKE ${pattern}
           OR id = ${exactId})
    GROUP BY status` as { status: string; n: number }[]
  const out = { received: 0, in_review: 0, fixed: 0, closed: 0 } as Record<ReportStatus, number>
  for (const r of rows) if ((REPORT_STATUSES as readonly string[]).includes(r.status)) out[r.status as ReportStatus] = Number(r.n)
  return out
}
export async function listReportById(sql: Sql, id: number): Promise<ReportRecord | null> {
  const rows = await sql`SELECT * FROM reports WHERE id = ${id}` as Record<string, unknown>[]
  return rows[0] ? normalizeReport(rows[0]) : null
}
export async function findReportByStatusHash(sql: Sql, hash: string): Promise<ReportRecord | null> {
  const rows = await sql`SELECT * FROM reports WHERE status_token_hash = ${hash}` as Record<string, unknown>[]
  return rows[0] ? normalizeReport(rows[0]) : null
}
export async function setReportStatus(sql: Sql, id: number, v: {
  status: ReportStatus; fixed_in: string | null; status_note: string | null
}): Promise<boolean> {
  const rows = await sql`UPDATE reports SET status = ${v.status}, fixed_in = ${v.fixed_in},
    status_note = ${v.status_note}, status_updated_at = now() WHERE id = ${id} RETURNING id` as { id: number }[]
  return rows.length > 0
}
/** The same public status for several reports at once (v1.5 bulk workflow).
 *  Each report keeps its own note unless a new one is given, and its "fixed
 *  in" version while it stays fixed and none is given. */
export async function setReportStatusMany(sql: Sql, ids: number[], v: {
  status: ReportStatus; fixed_in: string | null; status_note: string | null
}): Promise<number[]> {
  if (!ids.length) return []
  const rows = await sql`UPDATE reports SET status = ${v.status},
    fixed_in = CASE WHEN ${v.status}::text = 'fixed' THEN COALESCE(${v.fixed_in}::text, fixed_in) END,
    status_note = COALESCE(${v.status_note}::text, status_note), status_updated_at = now()
    WHERE id = ANY(${ids}) RETURNING id` as { id: number }[]
  return rows.map((r) => Number(r.id))
}
/** Delete one report row (the DSAR flow removes its Drive copies first) —
 *  only while its archive_ref is still ``archiveRef``, so a report the nightly
 *  archive took in the meantime is cleaned out of that archive first. */
export async function deleteReportRow(sql: Sql, id: number, archiveRef: string | null): Promise<boolean> {
  const rows = await sql`DELETE FROM reports WHERE id = ${id}
    AND archive_ref IS NOT DISTINCT FROM ${archiveRef}::text RETURNING id` as { id: number }[]
  return rows.length > 0
}
export async function listUnarchived(sql: Sql): Promise<ReportRecord[]> {
  const rows = await sql`SELECT * FROM reports WHERE archived_at IS NULL ORDER BY created_at ASC` as Record<string, unknown>[]
  return rows.map(normalizeReport)
}
export async function countUnarchived(sql: Sql): Promise<number> {
  const rows = await sql`SELECT count(*)::int AS n FROM reports WHERE archived_at IS NULL` as { n: number }[]
  return rows[0].n
}
/** Mark the reports among ``ids`` that are still unarchived (and still
 *  exist); returns the ids it marked. */
export async function markArchived(sql: Sql, ids: number[], archiveRef: string): Promise<number[]> {
  if (!ids.length) return []
  const rows = await sql`UPDATE reports SET archived_at = now(), archive_ref = ${archiveRef},
    image_status = CASE WHEN image_status = 'stored' THEN 'archived' WHEN image_status = 'uploading' THEN 'error' ELSE image_status END
    WHERE id = ANY(${ids}) AND archived_at IS NULL RETURNING id` as { id: number }[]
  return rows.map((r) => Number(r.id))
}
/** Retention: drop archived report rows created before the cutoff. Returns how many. */
export async function purgeArchivedReportsBefore(sql: Sql, beforeIso: string): Promise<number> {
  const rows = await sql`DELETE FROM reports WHERE archived_at IS NOT NULL AND created_at < ${beforeIso} RETURNING id` as { id: number }[]
  return rows.length
}

// ── admin statistics (v1.5) ───────────────────────────────────────────────────

export type ReportStatsRaw = {
  byStatus: Record<ReportStatus, number>
  bySource: { app: number; web: number }
  perWeek: { key: string; n: number }[]
  versions: { version: string; n: number }[]
  crashesPerDay: { key: string; n: number }[]
}
/** Counts behind the admin stats panel: buckets are UTC days / ISO weeks.
 *  ``byStatus`` may be passed in when the caller already counted the whole table. */
export async function reportStats(sql: Sql, byStatus?: Record<ReportStatus, number>): Promise<ReportStatsRaw> {
  const [status, source, weeks, versions, crashes] = await Promise.all([
    byStatus ?? statusCounts(sql),
    sql`SELECT source, count(*)::int AS n FROM reports GROUP BY source`,
    sql`SELECT to_char(date_trunc('week', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS key,
          count(*)::int AS n FROM reports WHERE created_at > now() - interval '13 weeks' GROUP BY 1`,
    sql`SELECT app_version AS version, count(*)::int AS n FROM reports
          WHERE app_version IS NOT NULL AND app_version <> '' GROUP BY 1 ORDER BY n DESC, 1 DESC LIMIT 6`,
    sql`SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS key,
          count(*)::int AS n FROM crash_events WHERE created_at > now() - interval '15 days' GROUP BY 1`,
  ]) as [Record<ReportStatus, number>, { source: string; n: number }[], { key: string; n: number }[],
         { version: string; n: number }[], { key: string; n: number }[]]
  const bySource = { app: 0, web: 0 }
  for (const r of source) if (r.source === 'app' || r.source === 'web') bySource[r.source] = Number(r.n)
  return {
    byStatus: status, bySource,
    perWeek: weeks.map((r) => ({ key: String(r.key), n: Number(r.n) })),
    versions: versions.map((r) => ({ version: String(r.version), n: Number(r.n) })),
    crashesPerDay: crashes.map((r) => ({ key: String(r.key), n: Number(r.n) })),
  }
}

// ── job locks (v1.6) ──────────────────────────────────────────────────────────

/** Take the lease on ``name`` for ``ttlSeconds`` if nobody holds a live one. */
export async function acquireJobLock(sql: Sql, name: string, holder: string, ttlSeconds: number): Promise<boolean> {
  const rows = await sql`INSERT INTO job_locks (name, holder, until)
    VALUES (${name}, ${holder}, now() + ${ttlSeconds}::int * interval '1 second')
    ON CONFLICT (name) DO UPDATE SET holder = EXCLUDED.holder, until = EXCLUDED.until
      WHERE job_locks.until < now()
    RETURNING holder` as { holder: string }[]
  return rows.length > 0
}
/** Give the lease back (only if it is still ours). */
export async function releaseJobLock(sql: Sql, name: string, holder: string): Promise<void> {
  await sql`DELETE FROM job_locks WHERE name = ${name} AND holder = ${holder}`
}

// ── rate limiting ─────────────────────────────────────────────────────────────

export type RateKind = 'report' | 'login' | 'login_fail' | 'crash' | 'ack' | 'ack_to'
export async function recordRateEvent(sql: Sql, ip_hash: string, kind: RateKind = 'report'): Promise<void> {
  await sql`INSERT INTO rate_events (ip_hash, kind) VALUES (${ip_hash}, ${kind})`
}
/**
 * Count and record a rate event in one transaction, serialized by an advisory
 * lock: per kind when there is a global cap (so the global count is exact too),
 * else per kind and IP. Returns the limit that blocked it, or null once recorded.
 */
export async function tryRecordRateEvent(sql: Sql, ip_hash: string, kind: RateKind, limits: RateLimits, nowMs: number):
  Promise<null | RateReason> {
  const global = Number.isFinite(limits.globalDay) ? limits.globalDay : null
  const lockKey = global === null ? `${kind}:${ip_hash}` : kind
  const minAgo = new Date(nowMs - 60_000).toISOString()
  const dayAgo = new Date(nowMs - 86_400_000).toISOString()
  const [, rows] = await sql.transaction((txn) => [
    txn`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`,
    txn`WITH c AS (
        SELECT count(*) FILTER (WHERE ip_hash = ${ip_hash} AND created_at > ${minAgo}) AS m,
               count(*) FILTER (WHERE ip_hash = ${ip_hash}) AS d,
               count(*) AS g
          FROM rate_events
         WHERE kind = ${kind} AND created_at > ${dayAgo} AND (${global}::int IS NOT NULL OR ip_hash = ${ip_hash})
      ), r AS (
        SELECT CASE WHEN m >= ${limits.perIpMinute} THEN 'rate_minute'
                    WHEN d >= ${limits.perIpDay} THEN 'rate_day'
                    WHEN ${global}::int IS NOT NULL AND g >= ${global}::int THEN 'rate_global' END AS reason FROM c
      ), ins AS (
        INSERT INTO rate_events (ip_hash, kind) SELECT ${ip_hash}, ${kind} FROM r WHERE reason IS NULL RETURNING 1
      )
      SELECT reason FROM r`,
  ]) as [unknown, { reason: RateReason | null }[]]
  return rows[0]?.reason ?? null
}
export async function pruneRateEvents(sql: Sql, beforeIso: string): Promise<void> {
  await sql`DELETE FROM rate_events WHERE created_at < ${beforeIso}`
}

// ── admin sessions ────────────────────────────────────────────────────────────

export type AdminSessionRow = { id: string; auth_time: string; expires_at: string }
export async function insertAdminSession(sql: Sql, v: { id: string; family: string; authTime: string; expiresAt: string; ipHash: string }): Promise<void> {
  await sql`INSERT INTO admin_sessions (id, family, auth_time, expires_at, ip_hash)
    VALUES (${v.id}, ${v.family}, ${v.authTime}, ${v.expiresAt}, ${v.ipHash})`
}
/** The session if it exists, is not revoked and has not expired; otherwise null. */
export async function getLiveAdminSession(sql: Sql, id: string): Promise<AdminSessionRow | null> {
  const rows = await sql`SELECT id, auth_time, expires_at FROM admin_sessions
    WHERE id = ${id} AND revoked_at IS NULL AND expires_at > now()` as Record<string, unknown>[]
  if (!rows[0]) return null
  return { id: String(rows[0].id), auth_time: iso(rows[0].auth_time) as string, expires_at: iso(rows[0].expires_at) as string }
}
/** Rotate a session id at most once: mark it and cap its life at the grace instant. */
export async function claimAdminSessionRotation(sql: Sql, id: string, graceUntilIso: string): Promise<boolean> {
  const rows = await sql`UPDATE admin_sessions SET rotated_at = now(),
      expires_at = LEAST(expires_at, ${graceUntilIso}::timestamptz)
    WHERE id = ${id} AND rotated_at IS NULL AND revoked_at IS NULL AND expires_at > now()
    RETURNING id` as { id: string }[]
  return rows.length > 0
}
/** End a sign-in: every session rotated from it, including any still in grace. */
export async function revokeAdminSessionFamily(sql: Sql, family: string): Promise<void> {
  await sql`UPDATE admin_sessions SET revoked_at = now() WHERE family = ${family} AND revoked_at IS NULL`
}
export async function revokeAllAdminSessions(sql: Sql): Promise<number> {
  const rows = await sql`UPDATE admin_sessions SET revoked_at = now() WHERE revoked_at IS NULL RETURNING id` as { id: string }[]
  return rows.length
}
export async function countLiveAdminSessions(sql: Sql): Promise<number> {
  const rows = await sql`SELECT count(*)::int AS n FROM admin_sessions WHERE revoked_at IS NULL AND expires_at > now()` as { n: number }[]
  return rows[0].n
}
export async function purgeAdminSessions(sql: Sql, beforeIso: string): Promise<void> {
  await sql`DELETE FROM admin_sessions WHERE expires_at < ${beforeIso}`
}

// ── admin audit log ───────────────────────────────────────────────────────────

export type AuditEvent =
  | 'login_ok' | 'login_fail' | 'logout' | 'logout_all'
  | 'archive' | 'status_change' | 'maintenance' | 'dsar_delete' | 'dsar_failed'
export type AuditRow = { id: number; at: string; event: AuditEvent; ip_hash: string | null; detail: string | null }

export async function insertAudit(sql: Sql, event: AuditEvent, ipHash: string | null, detail: string | null = null): Promise<void> {
  await sql`INSERT INTO admin_audit (event, ip_hash, detail) VALUES (${event}, ${ipHash}, ${detail})`
}
export async function listAudit(sql: Sql, limit: number): Promise<AuditRow[]> {
  const rows = await sql`SELECT id, at, event, ip_hash, detail FROM admin_audit ORDER BY at DESC LIMIT ${limit}` as Record<string, unknown>[]
  return rows.map((r) => ({ id: Number(r.id), at: iso(r.at) as string, event: r.event as AuditEvent,
    ip_hash: (r.ip_hash as string | null) ?? null, detail: (r.detail as string | null) ?? null }))
}
/**
 * Failed logins from one address since a time, plus when the latest happened.
 * Counted from rate events (kept two days), not the audit log, so the audit
 * cap below can never weaken the lockout.
 */
export async function loginFailuresSince(sql: Sql, ipHash: string, sinceIso: string): Promise<{ count: number; last: string | null }> {
  const rows = await sql`SELECT count(*)::int AS n, max(created_at) AS last FROM rate_events
    WHERE kind = 'login_fail' AND ip_hash = ${ipHash} AND created_at > ${sinceIso}` as Record<string, unknown>[]
  return { count: Number(rows[0]?.n ?? 0), last: iso(rows[0]?.last) }
}
/** How many entries of one audit event were written since a time (for the per-hour cap). */
export async function countAuditSince(sql: Sql, event: AuditEvent, sinceIso: string): Promise<number> {
  const rows = await sql`SELECT count(*)::int AS n FROM admin_audit WHERE event = ${event} AND at > ${sinceIso}` as { n: number }[]
  return rows[0].n
}
export async function purgeAuditBefore(sql: Sql, beforeIso: string): Promise<void> {
  await sql`DELETE FROM admin_audit WHERE at < ${beforeIso}`
}

// ── TOTP replay guard ─────────────────────────────────────────────────────────

/** Atomically claim a TOTP time-step. False if that step was already used. */
export async function claimTotpStep(sql: Sql, step: number): Promise<boolean> {
  const rows = await sql`INSERT INTO admin_totp_used (step) VALUES (${step})
    ON CONFLICT (step) DO NOTHING RETURNING step` as { step: number }[]
  return rows.length > 0
}
export async function purgeTotpSteps(sql: Sql, beforeIso: string): Promise<void> {
  await sql`DELETE FROM admin_totp_used WHERE used_at < ${beforeIso}`
}

// ── crash fingerprints ────────────────────────────────────────────────────────

export type CrashGroup = {
  fingerprint: string; exc_type: string; message: string | null; frames: string
  first_seen: string; last_seen: string; hits: number; users: number; last_version: string | null
}
/**
 * At most this many distinct crashes are tracked. Fingerprints come from
 * client-chosen data, so without a cap junk could push real crashes off the
 * panel; past it, known crashes still count but new ones are dropped.
 */
export const MAX_CRASH_GROUPS = 500
export async function recordCrash(sql: Sql, c: {
  fingerprint: string; excType: string; message: string; frames: string
  appVersion: string; os: string; ipHash: string
}): Promise<void> {
  await sql.transaction((txn) => [
    txn`INSERT INTO crash_groups (fingerprint, exc_type, message, frames, hits, last_version)
        SELECT ${c.fingerprint}, ${c.excType}, ${c.message}, ${c.frames}, 1, ${c.appVersion}
        WHERE EXISTS (SELECT 1 FROM crash_groups WHERE fingerprint = ${c.fingerprint})
           OR (SELECT count(*) FROM crash_groups) < ${MAX_CRASH_GROUPS}
        ON CONFLICT (fingerprint) DO UPDATE SET hits = crash_groups.hits + 1, last_seen = now(),
          message = EXCLUDED.message, last_version = EXCLUDED.last_version`,
    txn`INSERT INTO crash_events (fingerprint, app_version, os, ip_hash)
        SELECT ${c.fingerprint}, ${c.appVersion}, ${c.os}, ${c.ipHash}
        WHERE EXISTS (SELECT 1 FROM crash_groups WHERE fingerprint = ${c.fingerprint})`,
  ])
}
export async function listCrashGroups(sql: Sql, limit: number): Promise<CrashGroup[]> {
  const rows = await sql`SELECT g.*, (SELECT count(DISTINCT e.ip_hash)::int FROM crash_events e
      WHERE e.fingerprint = g.fingerprint) AS users
    FROM crash_groups g ORDER BY g.last_seen DESC LIMIT ${limit}` as Record<string, unknown>[]
  return rows.map((r) => ({
    fingerprint: String(r.fingerprint), exc_type: String(r.exc_type), message: (r.message as string | null) ?? null,
    frames: String(r.frames), first_seen: iso(r.first_seen) as string, last_seen: iso(r.last_seen) as string,
    hits: Number(r.hits), users: Number(r.users), last_version: (r.last_version as string | null) ?? null,
  }))
}
export async function purgeCrashesBefore(sql: Sql, beforeIso: string): Promise<void> {
  await sql`DELETE FROM crash_events WHERE created_at < ${beforeIso}`
  await sql`DELETE FROM crash_groups WHERE last_seen < ${beforeIso}`
}
