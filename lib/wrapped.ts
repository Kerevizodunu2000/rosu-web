// SPDX-License-Identifier: GPL-3.0-or-later
// Rosu Wrapped (v2.0): a year of a Library, from the desktop app's JSON export
// (Search → Export… → JSON). A set counts for the year it first reached Rosu
// (its first_seen_at). Parsed defensively — the file comes from the visitor
// and never leaves the browser.

export type WrappedStats = {
  year: number
  added: number
  byMonth: number[]                         // 12 counts, January first
  busiestMonth: number | null               // 0–11
  topArtists: { artist: string; sets: number }[]
  topMode: string | null
  hours: number
  starMax: number | null
}

const MODES = ['osu!', 'osu!taiko', 'osu!catch', 'osu!mania']
const MAX_SETS = 200_000
const YEAR_RE = /^(\d{4})-(\d{2})/

type Rec = Record<string, unknown>

function records(json: unknown): Rec[] | null {
  const all = json && typeof json === 'object' && Array.isArray((json as { sets?: unknown }).sets)
    ? (json as { sets: unknown[] }).sets : null
  if (!all) return null
  return all.slice(0, MAX_SETS).filter((s): s is Rec => s !== null && typeof s === 'object' && !Array.isArray(s))
}

/** ``[year, month]`` from a set's first_seen_at, or null. */
function seen(r: Rec): [number, number] | null {
  const m = typeof r.first_seen_at === 'string' ? YEAR_RE.exec(r.first_seen_at) : null
  if (!m) return null
  const year = Number(m[1]), month = Number(m[2]) - 1
  return year >= 2007 && year <= 2100 && month >= 0 && month < 12 ? [year, month] : null
}

/** The years the export has sets for, newest first. */
export function wrappedYears(json: unknown): number[] | { error: 'not_export' | 'no_dates' } {
  const sets = records(json)
  if (!sets) return { error: 'not_export' }
  const years = new Set<number>()
  for (const r of sets) { const s = seen(r); if (s) years.add(s[0]) }
  return years.size ? [...years].sort((a, b) => b - a) : { error: 'no_dates' }
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export function wrappedStats(json: unknown, year: number): WrappedStats | { error: 'not_export' } {
  const sets = records(json)
  if (!sets) return { error: 'not_export' }
  const byMonth = Array<number>(12).fill(0)
  const artists = new Map<string, number>()
  const modes = new Map<string, number>()
  let added = 0, seconds = 0
  let starMax: number | null = null
  for (const r of sets) {
    const s = seen(r)
    if (!s || s[0] !== year) continue
    added++
    byMonth[s[1]]++
    const artist = typeof r.artist === 'string' ? r.artist.trim().slice(0, 80) : ''
    if (artist) artists.set(artist, (artists.get(artist) ?? 0) + 1)
    const ms = Array.isArray(r.modes) ? r.modes.filter((m): m is string => typeof m === 'string' && MODES.includes(m)) : []
    for (const m of new Set(ms)) modes.set(m, (modes.get(m) ?? 0) + 1)
    const len = num(r.length_seconds)
    if (len !== null && len > 0 && len < 6 * 3600) seconds += len
    for (const st of Array.isArray(r.stars) ? r.stars.map(num) : []) {
      if (st !== null && st < 100 && (starMax === null || st > starMax)) starMax = st
    }
  }
  const peak = Math.max(...byMonth)
  return {
    year, added, byMonth,
    busiestMonth: peak > 0 ? byMonth.indexOf(peak) : null,
    topArtists: [...artists].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5)
      .map(([artist, n]) => ({ artist, sets: n })),
    // Ties go to the order osu! lists its modes in.
    topMode: [...modes].sort((a, b) => b[1] - a[1] || MODES.indexOf(a[0]) - MODES.indexOf(b[0]))[0]?.[0] ?? null,
    hours: Math.round(seconds / 360) / 10,
    starMax: starMax === null ? null : Math.round(starMax * 100) / 100,
  }
}
