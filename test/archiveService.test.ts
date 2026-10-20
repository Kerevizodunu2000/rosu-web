// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import type { ReportRecord } from '@/lib/db'
const rec = (r: Partial<ReportRecord>) => r as ReportRecord
import { runArchive, type ArchiveDeps } from '@/lib/archiveService'
import JSZip from 'jszip'
test('no unarchived → nothing', async () => {
  const r = await runArchive({ listUnarchived: async () => [], downloadImage: async () => new Uint8Array(),
    uploadArchive: async () => 'A', deleteArchive: async () => {}, markArchived: async () => [],
    deleteImage: async () => {} } as ArchiveDeps, '20260717')
  expect(r.archived).toBe(0)
})
test('bundles, uploads, marks, deletes', async () => {
  const deleted: string[] = []; let uploaded: Uint8Array | null = null; let marked: number[] = []
  const deps: ArchiveDeps = {
    listUnarchived: async () => [
      rec({ id: 1, title: 't', image_status: 'stored', image_drive_id: 'D1', image_name: 'rosu-1.png' }),
      rec({ id: 2, title: 'u', image_status: 'none', image_drive_id: null, image_name: null }),
    ],
    downloadImage: async () => new Uint8Array([1, 2, 3]),
    uploadArchive: async (name, bytes) => { uploaded = bytes; expect(name).toContain('20260717'); return 'AID' },
    deleteArchive: async () => { throw new Error('not expected') },
    markArchived: async (ids) => { marked = ids; return ids },
    deleteImage: async (id) => { deleted.push(id) },
  }
  const r = await runArchive(deps, '20260717')
  expect(r.archived).toBe(2); expect(marked).toEqual([1, 2]); expect(deleted).toEqual(['D1'])
  const zip = await JSZip.loadAsync(uploaded!); expect(zip.file('images/rosu-1.png')).toBeTruthy()
})
test('a failed image download does not wedge the archive', async () => {
  let marked: number[] = []; let uploaded: Uint8Array | null = null
  const deps: ArchiveDeps = {
    listUnarchived: async () => [
      rec({ id: 1, title: 't', image_status: 'stored', image_drive_id: 'GONE', image_name: 'rosu-1.png' }),
      rec({ id: 2, title: 'u', image_status: 'none', image_drive_id: null, image_name: null }),
    ],
    downloadImage: async () => { throw new Error('image deleted in Drive') },
    uploadArchive: async (_name, bytes) => { uploaded = bytes; return 'AID' },
    deleteArchive: async () => { throw new Error('not expected') },
    markArchived: async (ids) => { marked = ids; return ids },
    deleteImage: async () => {},
  }
  const r = await runArchive(deps, '20260718')
  expect(r.archived).toBe(2)              // both reports still archived
  expect(marked).toEqual([1, 2])
  const zip = await JSZip.loadAsync(uploaded!)
  expect(zip.file('images/rosu-1.png')).toBeNull() // the unreadable image is simply omitted
})

test('a report deleted while the ZIP was built is not left in it', async () => {
  const uploads: { name: string; bytes: Uint8Array }[] = []
  const deletedArchives: string[] = []
  const deletedImages: string[] = []
  const deps: ArchiveDeps = {
    listUnarchived: async () => [
      rec({ id: 1, title: 't', image_status: 'stored', image_drive_id: 'D1', image_name: 'rosu-1.png' }),
      rec({ id: 2, title: 'u', image_status: 'stored', image_drive_id: 'D2', image_name: 'rosu-2.png' }),
    ],
    downloadImage: async () => new Uint8Array([1]),
    uploadArchive: async (name, bytes) => { uploads.push({ name, bytes }); return `A${uploads.length}` },
    deleteArchive: async (id) => { deletedArchives.push(id) },
    markArchived: async () => [2],                       // #1 was deleted meanwhile
    deleteImage: async (id) => { deletedImages.push(id) },
  }
  expect(await runArchive(deps, '20261020')).toEqual({ archived: 1, archiveName: 'rosu-reports-20261020.zip' })
  expect(uploads.map((u) => u.name)).toEqual(['rosu-reports-20261020.zip', 'rosu-reports-20261020.zip'])
  expect(deletedArchives).toEqual(['A1'])               // the first ZIP (with #1) is gone
  expect(deletedImages).toEqual(['D2'])                 // #1's screenshot is the deletion's business
  const zip = await JSZip.loadAsync(uploads[1].bytes)
  const ids = (JSON.parse(await zip.file('reports.json')!.async('string')) as { id: number }[]).map((r) => r.id)
  expect(ids).toEqual([2])
  expect(zip.file('images/rosu-1.png')).toBeNull()
})

test('an archive nobody claims is deleted, and an unmarked upload is taken back', async () => {
  const deletedArchives: string[] = []
  const base = {
    listUnarchived: async () => [rec({ id: 1, title: 't', image_status: 'none', image_drive_id: null, image_name: null })],
    downloadImage: async () => new Uint8Array(),
    uploadArchive: async () => 'A1',
    deleteArchive: async (id: string) => { deletedArchives.push(id) },
    deleteImage: async () => {},
  }
  expect(await runArchive({ ...base, markArchived: async () => [] }, '20261020')).toEqual({ archived: 0 })
  expect(deletedArchives).toEqual(['A1'])               // another run archived it first
  await expect(runArchive({ ...base, markArchived: async () => { throw new Error('db down') } }, '20261020'))
    .rejects.toThrow('db down')
  expect(deletedArchives).toEqual(['A1', 'A1'])         // the next run archives it again, once
})
