// SPDX-License-Identifier: GPL-3.0-or-later
import { neon } from '@neondatabase/serverless'

export type ReportRecord = {
  id: number; created_at: string; source: 'app' | 'web'
  title: string; description: string; contact: string | null
  app_version: string | null; os: string | null; lang: string | null; ip_hash: string | null
  image_status: 'none' | 'stored' | 'archived' | 'error'
  image_drive_id: string | null; image_name: string | null; image_mime: string | null
  archive_ref: string | null; archived_at: string | null
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

export async function insertReport(sql: Sql, r: {
  source: string; title: string; description: string; contact: string
  app_version: string; os: string; lang: string; ip_hash: string
}): Promise<{ id: number }> {
  const rows = await sql`
    INSERT INTO reports (source, title, description, contact, app_version, os, lang, ip_hash)
    VALUES (${r.source}, ${r.title}, ${r.description}, ${r.contact}, ${r.app_version}, ${r.os}, ${r.lang}, ${r.ip_hash})
    RETURNING id` as { id: number }[]
  return { id: Number(rows[0].id) }
}

export async function setReportImage(sql: Sql, id: number, v: {
  image_status: string; image_drive_id?: string; image_name?: string; image_mime?: string
}): Promise<void> {
  await sql`UPDATE reports SET image_status = ${v.image_status},
    image_drive_id = ${v.image_drive_id ?? null}, image_name = ${v.image_name ?? null},
    image_mime = ${v.image_mime ?? null} WHERE id = ${id}`
}

const iso = (v: unknown): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : String(v)
function normalizeReport(row: Record<string, unknown>): ReportRecord {
  return { ...(row as ReportRecord), id: Number(row.id),
    created_at: iso(row.created_at) as string, archived_at: iso(row.archived_at) }
}

export async function listRecentUnarchived(sql: Sql, limit: number): Promise<ReportRecord[]> {
  const rows = await sql`SELECT * FROM reports WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT ${limit}` as Record<string, unknown>[]
  return rows.map(normalizeReport)
}
export async function listReportById(sql: Sql, id: number): Promise<ReportRecord | null> {
  const rows = await sql`SELECT * FROM reports WHERE id = ${id}` as Record<string, unknown>[]
  return rows[0] ? normalizeReport(rows[0]) : null
}
export async function listUnarchived(sql: Sql): Promise<ReportRecord[]> {
  const rows = await sql`SELECT * FROM reports WHERE archived_at IS NULL ORDER BY created_at ASC` as Record<string, unknown>[]
  return rows.map(normalizeReport)
}
export async function markArchived(sql: Sql, ids: number[], archiveRef: string): Promise<void> {
  if (!ids.length) return
  await sql`UPDATE reports SET archived_at = now(), archive_ref = ${archiveRef},
    image_status = CASE WHEN image_status = 'stored' THEN 'archived' ELSE image_status END
    WHERE id = ANY(${ids})`
}
export async function recordRateEvent(sql: Sql, ip_hash: string): Promise<void> {
  await sql`INSERT INTO rate_events (ip_hash) VALUES (${ip_hash})`
}
export async function countEventsSince(sql: Sql, ip_hash: string, sinceIso: string): Promise<number> {
  const rows = await sql`SELECT count(*)::int AS n FROM rate_events WHERE ip_hash = ${ip_hash} AND created_at > ${sinceIso}` as { n: number }[]
  return rows[0].n
}
export async function countAllEventsSince(sql: Sql, sinceIso: string): Promise<number> {
  const rows = await sql`SELECT count(*)::int AS n FROM rate_events WHERE created_at > ${sinceIso}` as { n: number }[]
  return rows[0].n
}
export async function pruneRateEvents(sql: Sql, beforeIso: string): Promise<void> {
  await sql`DELETE FROM rate_events WHERE created_at < ${beforeIso}`
}
