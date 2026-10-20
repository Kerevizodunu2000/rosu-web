// SPDX-License-Identifier: GPL-3.0-or-later
// Report status tracking: the reporter gets an unguessable link (no account);
// the server keeps only the token's SHA-256, so the link cannot be rebuilt
// from the database.
import { createHash, randomBytes } from 'node:crypto'
import { REPORT_STATUSES, type ReportStatus } from './db'
import { SITE_URL } from './links'
import { DEFAULT_LOCALE, isLocale, localePath } from './i18n'

export const STATUS_PATH = '/report/status'
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/ // 32 random bytes, base64url, no padding

export const newStatusToken = () => randomBytes(32).toString('base64url')
export const hashStatusToken = (token: string) => createHash('sha256').update(token).digest('hex')
export const isStatusToken = (v: string) => TOKEN_RE.test(v)

/**
 * Absolute base for links we hand out (API responses, e-mails). Production
 * always uses the canonical domain; a preview deploy links to itself so the
 * link works against the preview's own database. Never derived from the
 * request's Host header, which a client controls.
 */
export function publicBaseUrl(env: Record<string, string | undefined> = process.env): string {
  if (env.VERCEL_ENV === 'production' || !env.VERCEL_URL) return SITE_URL
  return `https://${env.VERCEL_URL}`
}
/** The tracking link, on the status page in the reporter's language when the
 *  report says one we have (``lang`` is free text from the client). */
export const statusUrl = (token: string, base = publicBaseUrl(), lang: string = DEFAULT_LOCALE) =>
  `${base}${localePath(isLocale(lang) ? lang : DEFAULT_LOCALE, STATUS_PATH)}/${token}`

export const STATUS_LABELS: Record<ReportStatus, string> = {
  received: 'Received',
  in_review: 'In review',
  fixed: 'Fixed',
  closed: 'Closed',
}

const VERSION_RE = /^v?\d{1,3}\.\d{1,3}(\.\d{1,3})?$/
export const NOTE_MAX = 280

/** Validate an admin status update. Returns the clean values or an error code. */
export function parseStatusUpdate(raw: unknown):
  | { ok: true; value: { id: number; status: ReportStatus; fixed_in: string | null; status_note: string | null } }
  | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'bad_json' }
  const d = raw as Record<string, unknown>
  const id = Number(d.id)
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, error: 'bad_id' }
  const status = d.status as ReportStatus
  if (!REPORT_STATUSES.includes(status)) return { ok: false, error: 'bad_status' }
  let fixed_in: string | null = typeof d.fixed_in === 'string' ? d.fixed_in.trim() : ''
  if (!fixed_in || status !== 'fixed') fixed_in = null
  else if (!VERSION_RE.test(fixed_in)) return { ok: false, error: 'bad_version' }
  else if (!fixed_in.startsWith('v')) fixed_in = `v${fixed_in}`
  const note = typeof d.status_note === 'string' ? d.status_note.trim().slice(0, NOTE_MAX) : ''
  return { ok: true, value: { id, status, fixed_in, status_note: note || null } }
}

export const BULK_MAX = 100

/** The same update for several reports (v1.5 bulk workflow): ``ids`` is 1–100
 *  distinct positive ids; everything else is validated as in {@link parseStatusUpdate}. */
export function parseBulkStatusUpdate(raw: unknown):
  | { ok: true; value: { ids: number[]; status: ReportStatus; fixed_in: string | null; status_note: string | null } }
  | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'bad_json' }
  const d = raw as Record<string, unknown>
  if (!Array.isArray(d.ids) || d.ids.length === 0 || d.ids.length > BULK_MAX) return { ok: false, error: 'bad_ids' }
  const ids = [...new Set(d.ids.map(Number))]
  if (!ids.every((n) => Number.isSafeInteger(n) && n > 0)) return { ok: false, error: 'bad_ids' }
  const one = parseStatusUpdate({ ...d, id: ids[0] })
  if (!one.ok) return one
  const { status, fixed_in, status_note } = one.value
  return { ok: true, value: { ids, status, fixed_in, status_note } }
}
