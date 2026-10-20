// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { retentionCutoff, expiredArchives, runRetention, type RetentionDeps } from '@/lib/retention'

const NOW = Date.UTC(2026, 9, 20, 3) // 2026-10-20 03:00 UTC

test('cutoff is twelve calendar months back', () => {
  expect(retentionCutoff(NOW).toISOString()).toBe('2025-10-20T03:00:00.000Z')
})

test('only our own archive names past the cutoff are selected', () => {
  const cutoff = retentionCutoff(NOW)
  const files = [
    { id: '1', name: 'rosu-reports-20251018.zip' },                // old enough
    { id: '2', name: 'rosu-reports-20251020.zip' },                // same day as cutoff: its day is not over
    { id: '3', name: 'rosu-reports-20260101.zip' },                // recent
    { id: '4', name: 'something-else.zip' },                       // not ours
    // Rewritten later (a report taken out for a deletion request): the name's date still decides.
    { id: '5', name: 'rosu-reports-20250101.zip', createdTime: '2026-03-01T00:00:00Z' },
  ]
  expect(expiredArchives(files, cutoff).map((f) => f.id)).toEqual(['1', '5'])
})

test('runRetention deletes, purges and counts failures without stopping', async () => {
  const deleted: string[] = []
  let purgedBefore = ''
  const deps: RetentionDeps = {
    listArchives: async () => [{ id: 'a', name: 'rosu-reports-20240101.zip' }, { id: 'b', name: 'rosu-reports-20240102.zip' }],
    deleteArchive: async (id) => { if (id === 'a') throw new Error('drive'); deleted.push(id) },
    purgeReports: async (before) => { purgedBefore = before; return 4 },
    purgeCrashes: async () => {},
    purgeAudit: async () => {},
    purgeEphemeral: async () => {},
  }
  expect(await runRetention(deps, NOW)).toEqual({ archivesDeleted: 1, reportsDeleted: 4, failures: 1 })
  expect(deleted).toEqual(['b'])
  expect(purgedBefore).toBe('2025-10-20T03:00:00.000Z')
})

test('a Drive failure does not stop the database purges', async () => {
  const done: string[] = []
  const deps: RetentionDeps = {
    listArchives: async () => { throw new Error('drive down') },
    deleteArchive: async () => {},
    purgeReports: async () => { done.push('reports'); return 2 },
    purgeCrashes: async () => { done.push('crashes') },
    purgeAudit: async () => { throw new Error('db hiccup') },
    purgeEphemeral: async () => { done.push('ephemeral') },
  }
  expect(await runRetention(deps, NOW)).toEqual({ archivesDeleted: 0, reportsDeleted: 2, failures: 2 })
  expect(done).toEqual(['reports', 'crashes', 'ephemeral'])
})
