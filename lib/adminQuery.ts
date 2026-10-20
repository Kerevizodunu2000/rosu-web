// SPDX-License-Identifier: GPL-3.0-or-later
// The admin report list's URL state (v1.5): view, text search, status and
// source filters, and the page. Parsed strictly — anything unexpected falls
// back to the default instead of reaching SQL.
import { REPORT_STATUSES, type ReportStatus } from './db'

export const PAGE_SIZE = 50
export const Q_MAX = 120

export type AdminQuery = {
  view: 'unarchived' | 'all'
  q: string
  status: ReportStatus | null
  source: 'app' | 'web' | null
  page: number
}

const one = (v: unknown): string => (Array.isArray(v) ? String(v[0] ?? '') : typeof v === 'string' ? v : '')

export function parseAdminQuery(params: Record<string, unknown>): AdminQuery {
  const status = one(params.status) as ReportStatus
  const source = one(params.source)
  const page = Number(one(params.page))
  return {
    view: one(params.view) === 'all' ? 'all' : 'unarchived',
    q: one(params.q).replace(/\s+/g, ' ').trim().slice(0, Q_MAX),
    status: REPORT_STATUSES.includes(status) ? status : null,
    source: source === 'app' || source === 'web' ? source : null,
    page: Number.isSafeInteger(page) && page >= 1 && page <= 10_000 ? page : 1,
  }
}

/** The admin page URL for ``q`` with some fields changed (defaults are omitted). */
export function adminHref(base: string, q: AdminQuery, change: Partial<AdminQuery> = {}): string {
  const next = { ...q, ...change }
  const p = new URLSearchParams()
  if (next.view === 'all') p.set('view', 'all')
  if (next.q) p.set('q', next.q)
  if (next.status) p.set('status', next.status)
  if (next.source) p.set('source', next.source)
  if (next.page > 1) p.set('page', String(next.page))
  const s = p.toString()
  return s ? `${base}?${s}` : base
}

/** ``%text%`` for ILIKE with the user's own %, _ and \ taken literally. */
export function likePattern(q: string): string | null {
  return q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE))
}
