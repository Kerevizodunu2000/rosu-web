// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { wrappedStats, wrappedYears } from '@/lib/wrapped'

const exp = { sets: [
  { artist: 'Camellia', modes: ['osu!mania'], stars: [3.2, 7.5], length_seconds: 180, first_seen_at: '2026-03-02T10:00:00' },
  { artist: 'Camellia', modes: ['osu!mania', 'osu!'], stars: [5], length_seconds: 120, first_seen_at: '2026-03-20' },
  { artist: 'xi', modes: ['osu!'], stars: [6.1], length_seconds: 240, first_seen_at: '2026-11-01T00:00:00' },
  { artist: 'old', modes: ['osu!taiko'], stars: [2], length_seconds: 60, first_seen_at: '2025-12-31T23:59:59' },
  { artist: 'nodate', modes: ['osu!'], stars: [9] },
  'junk', null,
] }

test('years come from when sets first reached Rosu', () => {
  expect(wrappedYears(exp)).toEqual([2026, 2025])
  expect(wrappedYears({ sets: [{ artist: 'a' }] })).toEqual({ error: 'no_dates' })
  expect(wrappedYears({ hello: 1 })).toEqual({ error: 'not_export' })
})

test('a year in numbers', () => {
  const s = wrappedStats(exp, 2026)
  expect(s).toEqual({
    year: 2026, added: 3,
    byMonth: [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    busiestMonth: 2,
    topArtists: [{ artist: 'Camellia', sets: 2 }, { artist: 'xi', sets: 1 }],
    topMode: 'osu!',            // 2 each; osu! comes first in osu!'s own order
    hours: 0.2,
    starMax: 7.5,
  })
  expect(wrappedStats(exp, 2024)).toMatchObject({ added: 0, busiestMonth: null, topMode: null, starMax: null })
})
