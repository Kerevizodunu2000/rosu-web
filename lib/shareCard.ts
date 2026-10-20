// SPDX-License-Identifier: GPL-3.0-or-later
// Library share card (v1.6): the headline numbers of a Rosu Library, read from
// the desktop app's JSON export (Search → Export… → JSON). Parsed defensively —
// the file comes from the visitor and never leaves the browser.

export type CardStats = {
  sets: number
  capped: boolean                 // more than MAX_SETS: only the first were counted
  modes: { mode: string; sets: number }[]
  topArtists: { artist: string; sets: number }[]
  starMax: number | null
  hours: number
  mania: { keys: number; sets: number }[]
}

const MODES = ['osu!', 'osu!taiko', 'osu!catch', 'osu!mania']
export const MAX_SETS = 200_000

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Stats from the export, or an error code when it is not a Rosu export. */
export function cardStats(json: unknown): CardStats | { error: 'not_export' | 'empty' } {
  const all = (json && typeof json === 'object' && Array.isArray((json as { sets?: unknown }).sets))
    ? (json as { sets: unknown[] }).sets : null
  if (!all) return { error: 'not_export' }
  const sets = all.slice(0, MAX_SETS).filter((s) => s !== null && typeof s === 'object' && !Array.isArray(s))
  if (!sets.length) return { error: 'empty' }
  const modeCount = new Map<string, number>()
  const artistCount = new Map<string, number>()
  const keyCount = new Map<number, number>()
  let starMax: number | null = null
  let seconds = 0
  for (const s of sets) {
    const r = s as Record<string, unknown>
    const modes = Array.isArray(r.modes) ? r.modes.filter((m): m is string => typeof m === 'string') : []
    for (const m of new Set(modes)) if (MODES.includes(m)) modeCount.set(m, (modeCount.get(m) ?? 0) + 1)
    const artist = typeof r.artist === 'string' ? r.artist.trim().slice(0, 80) : ''
    if (artist) artistCount.set(artist, (artistCount.get(artist) ?? 0) + 1)
    const stars = Array.isArray(r.stars) ? r.stars.map(num).filter((v): v is number => v !== null && v < 100) : []
    for (const st of stars) if (starMax === null || st > starMax) starMax = st
    const len = num(r.length_seconds)
    if (len !== null && len > 0 && len < 6 * 3600) seconds += len
    const keys = Array.isArray(r.keys) ? r.keys.map(num).filter((v): v is number => v !== null && v >= 1 && v <= 18) : []
    for (const k of new Set(keys)) keyCount.set(k, (keyCount.get(k) ?? 0) + 1)
  }
  return {
    sets: sets.length,
    capped: all.length > MAX_SETS,
    modes: MODES.filter((m) => modeCount.has(m)).map((m) => ({ mode: m, sets: modeCount.get(m)! })),
    topArtists: [...artistCount].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5)
      .map(([artist, n]) => ({ artist, sets: n })),
    starMax: starMax === null ? null : Math.round(starMax * 100) / 100,
    hours: Math.round(seconds / 360) / 10,
    mania: [...keyCount].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([keys, n]) => ({ keys, sets: n })),
  }
}
