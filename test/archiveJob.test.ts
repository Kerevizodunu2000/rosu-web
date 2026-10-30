// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect, vi, beforeEach, afterEach } from 'vitest'

const m = vi.hoisted(() => ({ runArchive: vi.fn(), pruneRateEvents: vi.fn() }))
vi.mock('@/lib/db', () => ({
  getDb: async () => ({}),
  pruneRateEvents: m.pruneRateEvents,
  acquireJobLock: async () => true,
  releaseJobLock: async () => {},
  insertAudit: async () => {},
}))
vi.mock('@/lib/archiveService', async (orig) => ({ ...(await orig<object>()), runArchive: m.runArchive }))

import { runArchiveJob } from '@/lib/archiveJob'

const ENV = ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN']
beforeEach(() => {
  vi.clearAllMocks()
  for (const k of ENV) vi.stubEnv(k, 'x')
  m.runArchive.mockResolvedValue({ archived: 2, archiveName: 'a.zip' })
  m.pruneRateEvents.mockResolvedValue(undefined)
})
afterEach(() => { vi.unstubAllEnvs() })

test('missing Drive settings still prune, then fail', async () => {
  vi.stubEnv('GOOGLE_REFRESH_TOKEN', '')
  await expect(runArchiveJob()).rejects.toThrow('GOOGLE_REFRESH_TOKEN')
  expect(m.pruneRateEvents).toHaveBeenCalledOnce()
  expect(m.runArchive).not.toHaveBeenCalled()
})

test('the archive error wins over a prune error', async () => {
  m.runArchive.mockRejectedValue(new Error('A'))
  m.pruneRateEvents.mockRejectedValue(new Error('B'))
  await expect(runArchiveJob()).rejects.toThrow('A')
})

test('a prune error after a good archive is reported', async () => {
  m.pruneRateEvents.mockRejectedValue(new Error('B'))
  await expect(runArchiveJob()).rejects.toThrow('B')
})

test('both succeed', async () => {
  await expect(runArchiveJob()).resolves.toEqual({ archived: 2, archiveName: 'a.zip' })
  expect(m.pruneRateEvents).toHaveBeenCalledOnce()
})
