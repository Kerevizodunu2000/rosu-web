// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { fillSeries, niceMax, weekStart } from '@/lib/stats'

test('weeks start on Monday (UTC), like date_trunc', () => {
  expect(weekStart(new Date('2026-10-20T23:00:00Z')).toISOString().slice(0, 10)).toBe('2026-10-19')
  expect(weekStart(new Date('2026-10-25T10:00:00Z')).toISOString().slice(0, 10)).toBe('2026-10-19') // Sunday
  expect(weekStart(new Date('2026-10-19T00:00:00Z')).toISOString().slice(0, 10)).toBe('2026-10-19')
})

test('series are complete, oldest first, with zeros for empty buckets', () => {
  const now = new Date('2026-10-20T12:00:00Z')
  const weeks = fillSeries([{ key: '2026-10-19', n: 3 }, { key: '2026-10-05', n: 1 }, { key: '2025-01-06', n: 9 }],
    'week', 4, now)
  expect(weeks).toEqual([
    { key: '2026-09-28', n: 0 }, { key: '2026-10-05', n: 1 }, { key: '2026-10-12', n: 0 }, { key: '2026-10-19', n: 3 },
  ])
  const days = fillSeries([{ key: '2026-10-19', n: 2 }], 'day', 3, now)
  expect(days).toEqual([{ key: '2026-10-18', n: 0 }, { key: '2026-10-19', n: 2 }, { key: '2026-10-20', n: 0 }])
})

test('axis ceilings are clean numbers', () => {
  expect([0, 1, 3, 7, 12, 99, 101, 450].map(niceMax)).toEqual([1, 1, 5, 10, 20, 100, 200, 500])
})
