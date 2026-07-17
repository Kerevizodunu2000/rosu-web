// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { runArchive, type ArchiveDeps } from '@/lib/archiveService'
import JSZip from 'jszip'
test('no unarchived → nothing', async () => {
  const r = await runArchive({ listUnarchived: async () => [], downloadImage: async () => new Uint8Array(),
    uploadArchive: async () => 'A', markArchived: async () => {}, deleteImage: async () => {} } as ArchiveDeps, '20260717')
  expect(r.archived).toBe(0)
})
test('bundles, uploads, marks, deletes', async () => {
  const deleted: string[] = []; let uploaded: Uint8Array | null = null; let marked: number[] = []
  const deps: ArchiveDeps = {
    listUnarchived: async () => [
      { id: 1, title: 't', image_status: 'stored', image_drive_id: 'D1', image_name: 'rosu-1.png' } as any,
      { id: 2, title: 'u', image_status: 'none', image_drive_id: null, image_name: null } as any,
    ],
    downloadImage: async () => new Uint8Array([1, 2, 3]),
    uploadArchive: async (name, bytes) => { uploaded = bytes; expect(name).toContain('20260717'); return 'AID' },
    markArchived: async (ids) => { marked = ids },
    deleteImage: async (id) => { deleted.push(id) },
  }
  const r = await runArchive(deps, '20260717')
  expect(r.archived).toBe(2); expect(marked).toEqual([1, 2]); expect(deleted).toEqual(['D1'])
  const zip = await JSZip.loadAsync(uploaded!); expect(zip.file('images/rosu-1.png')).toBeTruthy()
})
