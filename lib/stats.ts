// SPDX-License-Identifier: GPL-3.0-or-later
// Admin statistics (v1.5): turn sparse per-bucket counts from SQL into a
// complete, evenly spaced series (empty weeks/days are zero, not missing).

export type Bucket = { key: string; n: number }

const DAY_MS = 24 * 60 * 60 * 1000
const ymd = (d: Date) => d.toISOString().slice(0, 10)

/** The UTC Monday of the week containing ``d`` (Postgres ``date_trunc('week')``). */
export function weekStart(d: Date): Date {
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  const dow = (new Date(day).getUTCDay() + 6) % 7   // Monday = 0
  return new Date(day - dow * DAY_MS)
}

/**
 * ``count`` buckets ending with the one that holds ``now``: weeks (keyed by
 * their Monday) or days, oldest first. Counts come from ``rows`` keyed the same
 * way (``YYYY-MM-DD``); anything outside the window is ignored.
 */
export function fillSeries(rows: Bucket[], unit: 'day' | 'week', count: number, now = new Date()): Bucket[] {
  const step = unit === 'week' ? 7 * DAY_MS : DAY_MS
  const end = unit === 'week' ? weekStart(now) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const counts = new Map(rows.map((r) => [r.key, Number(r.n) || 0]))
  const out: Bucket[] = []
  for (let i = count - 1; i >= 0; i--) {
    const key = ymd(new Date(end.getTime() - i * step))
    out.push({ key, n: counts.get(key) ?? 0 })
  }
  return out
}

/** A clean axis ceiling at or above ``max`` (1, 2, 5 × 10^k). */
export function niceMax(max: number): number {
  if (max <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(max))
  for (const m of [1, 2, 5, 10]) if (m * p >= max) return m * p
  return 10 * p
}
