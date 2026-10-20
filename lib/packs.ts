// SPDX-License-Identifier: GPL-3.0-or-later
// Missing-pack checker (v1.6): the same rules as the desktop app's gap
// detection (rosu/parsing.py, rosu/gaps.py), on file names only. The standard
// series (S, SM, ST, SC) are numbered without gaps by osu!, so a number missing
// between your lowest and highest owned pack is a real pack you don't have.
// Every other series is listed, never guessed. Runs in the browser — nothing
// is uploaded.

export const STANDARD = ['S', 'SM', 'ST', 'SC'] as const
export type Standard = (typeof STANDARD)[number]
export const SERIES_LABEL: Record<Standard, string> = {
  S: 'osu!', SM: 'osu!mania', ST: 'osu!taiko', SC: 'osu!catch',
}
export const packUrl = (code: string) => `https://osu.ppy.sh/beatmaps/packs/${encodeURIComponent(code)}`

const SUFFIXES = ['.tar.gz', '.tar.bz2', '.tar.xz', '.tgz', '.tbz2', '.txz', '.zip', '.7z', '.tar', '.rar']
const PACK_RE = /^([A-Za-z]+)(\d+)\s*-\s*(.+?)(?:\s+\((\d+)\))?$/
// A pack code on its own, as some downloaders name the files ("S1234.zip").
const CODE_ONLY_RE = /^([A-Za-z]{1,3})(\d{1,6})$/

export type Parsed = { series: string; number: number; code: string } | null

export function parsePackName(fileName: string): Parsed {
  let stem = fileName.split(/[\\/]/).pop()?.trim() ?? ''
  const low = stem.toLowerCase()
  const suf = SUFFIXES.find((s) => low.endsWith(s))
  if (suf) stem = stem.slice(0, -suf.length).trim()
  const m = PACK_RE.exec(stem) ?? CODE_ONLY_RE.exec(stem)
  if (!m) return null
  const series = m[1].toUpperCase()
  const number = Number(m[2])
  if (!Number.isSafeInteger(number) || number <= 0) return null
  return { series, number, code: `${series}${number}` }
}

export type SeriesReport = { series: string; owned: number; lowest: number; highest: number; missing: number[] }
export type PackReport = {
  standard: SeriesReport[]          // S, SM, ST, SC that you own any of, with gaps
  other: { series: string; owned: number }[]
  unrecognised: number               // names that are not packs at all
  total: number                      // distinct packs recognised
}

export const MAX_NAMES = 20_000

/** Owned packs per series and the interior gaps of the standard ones. */
export function packReport(names: string[]): PackReport {
  const bySeries = new Map<string, Set<number>>()
  let unrecognised = 0
  for (const name of names.slice(0, MAX_NAMES)) {
    if (!name.trim()) continue
    const p = parsePackName(name)
    if (!p) { unrecognised++; continue }
    if (!bySeries.has(p.series)) bySeries.set(p.series, new Set())
    bySeries.get(p.series)!.add(p.number)
  }
  const standard: SeriesReport[] = []
  const other: { series: string; owned: number }[] = []
  for (const [series, nums] of bySeries) {
    if ((STANDARD as readonly string[]).includes(series)) {
      const sorted = [...nums].sort((a, b) => a - b)
      const lowest = sorted[0], highest = sorted[sorted.length - 1]
      const missing: number[] = []
      for (let n = lowest; n <= highest; n++) if (!nums.has(n)) missing.push(n)
      standard.push({ series, owned: nums.size, lowest, highest, missing })
    } else {
      other.push({ series, owned: nums.size })
    }
  }
  standard.sort((a, b) => STANDARD.indexOf(a.series as Standard) - STANDARD.indexOf(b.series as Standard))
  other.sort((a, b) => a.series.localeCompare(b.series))
  const total = [...bySeries.values()].reduce((s, v) => s + v.size, 0)
  return { standard, other, unrecognised, total }
}

/** "S12, S15–S18": runs of missing numbers, for a compact copyable list. */
export function compactRanges(series: string, missing: number[]): string {
  const out: string[] = []
  for (let i = 0; i < missing.length; i++) {
    let j = i
    while (j + 1 < missing.length && missing[j + 1] === missing[j] + 1) j++
    out.push(j > i ? `${series}${missing[i]}–${series}${missing[j]}` : `${series}${missing[i]}`)
    i = j
  }
  return out.join(', ')
}
