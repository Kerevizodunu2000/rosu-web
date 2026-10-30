// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import JSZip from 'jszip'
import type { ReportRecord } from '@/lib/db'
import { runArchive, type ArchiveDeps } from '@/lib/archiveService'

const NOW = Date.parse('2026-10-30T12:00:00Z')
const ago = (ms: number) => new Date(NOW - ms).toISOString()
const rec = (r: Partial<ReportRecord>) => ({ title: 't', created_at: ago(86_400_000), image_drive_id: null, image_name: null, ...r }) as ReportRecord
const stored = (id: number, driveId: string) => rec({ id, image_status: 'stored', image_drive_id: driveId, image_name: `rosu-${id}.png` })

function harness(reports: ReportRecord[], downloadImage: ArchiveDeps['downloadImage']) {
  const s = { marked: [] as number[], deleted: [] as string[], uploads: 0, zip: null as Uint8Array | null, downloads: 0 }
  const deps: ArchiveDeps = {
    listUnarchived: async () => reports,
    downloadImage: async (id) => { s.downloads++; return downloadImage(id) },
    uploadArchive: async (_name, bytes) => { s.uploads++; s.zip = bytes; return 'AID' },
    deleteArchive: async () => { throw new Error('not expected') },
    markArchived: async (ids) => { s.marked = ids; return ids },
    deleteImage: async (id) => { s.deleted.push(id) },
  }
  return { deps, s, zipIds: async () => (JSON.parse(await (await JSZip.loadAsync(s.zip!)).file('reports.json')!.async('string')) as { id: number }[]).map((r) => r.id),
    zipHas: async (name: string) => (await JSZip.loadAsync(s.zip!)).file(`images/${name}`) !== null }
}

test('a young uploading report waits for the next run', async () => {
  const h = harness([rec({ id: 1, image_status: 'uploading', created_at: ago(10 * 60_000) }), rec({ id: 2, image_status: 'none' })],
    async () => new Uint8Array())
  expect(await runArchive(h.deps, '20261030', NOW)).toEqual({ archived: 1, archiveName: 'rosu-reports-20261030.zip' })
  expect(h.s.marked).toEqual([2])
  expect(await h.zipIds()).toEqual([2])
})

test('only young uploading reports: nothing is uploaded', async () => {
  const h = harness([rec({ id: 1, image_status: 'uploading', created_at: ago(10 * 60_000) })], async () => new Uint8Array())
  expect(await runArchive(h.deps, '20261030', NOW)).toEqual({ archived: 0 })
  expect(h.s.uploads).toBe(0)
})

test('an uploading report older than an hour is archived', async () => {
  const h = harness([rec({ id: 1, image_status: 'uploading', created_at: ago(2 * 3_600_000) })], async () => new Uint8Array())
  await runArchive(h.deps, '20261030', NOW)
  expect(h.s.marked).toEqual([1])
})

test('a transient download error is retried', async () => {
  let n = 0
  const h = harness([stored(1, 'D1')], async () => {
    if (++n < 3) throw new Error('Drive GET /files/D1?alt=media -> 503: x')
    return new Uint8Array([1])
  })
  expect((await runArchive(h.deps, '20261030', NOW)).archived).toBe(1)
  expect(h.s.downloads).toBe(3)
  expect(await h.zipHas('rosu-1.png')).toBe(true)
  expect(h.s.marked).toEqual([1])
  expect(h.s.deleted).toEqual(['D1'])
})

for (const [label, err] of [['Drive 503', () => new Error('Drive GET /files/D1?alt=media -> 503: x')],
  ['network failure', () => new TypeError('fetch failed')]] as const) {
  test(`a lasting ${label} leaves the report for the next run`, async () => {
    const h = harness([stored(1, 'D1'), stored(2, 'D2')], async (id) => {
      if (id === 'D1') throw err()
      return new Uint8Array([2])
    })
    expect((await runArchive(h.deps, '20261030', NOW)).archived).toBe(1)
    expect(h.s.downloads).toBe(4) // 3 for D1, 1 for D2
    expect(h.s.marked).toEqual([2])
    expect(await h.zipIds()).toEqual([2])
    expect(h.s.deleted).toEqual(['D2'])
  })
}

test('a Drive 404 archives the text without the image', async () => {
  const h = harness([stored(1, 'D1')], async () => { throw new Error('Drive GET /files/D1?alt=media -> 404: x') })
  expect((await runArchive(h.deps, '20261030', NOW)).archived).toBe(1)
  expect(h.s.downloads).toBe(1)
  expect(h.s.marked).toEqual([1])
  expect(await h.zipHas('rosu-1.png')).toBe(false)
})
