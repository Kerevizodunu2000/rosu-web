// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { cardStats, MAX_SETS } from '@/lib/shareCard'

test('stats from a Rosu JSON export', () => {
  const s = cardStats({ query: '', count: 3, sets: [
    { artist: 'Camellia', modes: ['osu!mania'], stars: [3.2, 6.81], keys: [4, 7], length_seconds: 180 },
    { artist: 'Camellia', modes: ['osu!', 'osu!mania'], stars: [5.1], keys: [7], length_seconds: 120 },
    { artist: 'xi', modes: ['osu!'], stars: [999], keys: [99], length_seconds: 1e9 },
    'junk', null,
  ] })
  expect(s).toEqual({
    sets: 3,                         // only real set records count
    capped: false,
    modes: [{ mode: 'osu!', sets: 2 }, { mode: 'osu!mania', sets: 2 }],
    topArtists: [{ artist: 'Camellia', sets: 2 }, { artist: 'xi', sets: 1 }],
    starMax: 6.81,
    hours: 0.1,
    mania: [{ keys: 7, sets: 2 }, { keys: 4, sets: 1 }],
  })
})

test('anything else is refused', () => {
  expect(cardStats({ hello: 1 })).toEqual({ error: 'not_export' })
  expect(cardStats(null)).toEqual({ error: 'not_export' })
  expect(cardStats({ sets: [] })).toEqual({ error: 'empty' })
  expect(cardStats({ sets: ['junk', null, [1]] })).toEqual({ error: 'empty' })
})

test('a library past the cap says so', () => {
  const s = cardStats({ sets: Array.from({ length: MAX_SETS + 1 }, () => ({ artist: 'a' })) })
  expect('error' in s ? null : [s.sets, s.capped]).toEqual([MAX_SETS, true])
})
