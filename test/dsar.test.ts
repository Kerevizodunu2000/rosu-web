// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import JSZip from 'jszip'
import { buildReportsZip, removeReportFromZip } from '@/lib/zip'
import { deleteReportEverywhere, parseDsarRequest, type DsarDeps } from '@/lib/dsar'
import type { ReportRecord } from '@/lib/db'

const report = (id: number, over: Partial<ReportRecord> = {}): ReportRecord => ({
  id, created_at: '2026-10-01T00:00:00.000Z', source: 'web', title: `t${id}`, description: 'd', contact: `u${id}@x.test`,
  app_version: null, os: null, lang: null, ip_hash: null, image_status: 'none', image_drive_id: null, image_name: null,
  image_mime: null, image_original_name: null, archive_ref: null, archived_at: null,
  status: 'received', status_note: null, fixed_in: null, status_updated_at: null, ...over,
})

async function archiveWith(...ids: number[]) {
  return buildReportsZip(ids.map((id) => ({
    report: report(id, { image_name: `report-${id}.png` }) as unknown as { id: number },
    image: { name: `report-${id}.png`, bytes: new Uint8Array([id]) },
  })))
}

test('a report is taken out of an archive: JSON, CSV and screenshot', async () => {
  const res = await removeReportFromZip(await archiveWith(1, 2), 1, 'report-1.png')
  expect(res.removed).toBe(true)
  expect(res.remaining).toBe(1)
  const zip = await JSZip.loadAsync(res.bytes)
  const json = JSON.parse(await zip.file('reports.json')!.async('string')) as { id: number }[]
  expect(json.map((r) => r.id)).toEqual([2])
  const csv = await zip.file('reports.csv')!.async('string')
  expect(csv).not.toContain('u1@x.test')
  expect(csv).toContain('u2@x.test')
  expect(zip.file('images/report-1.png')).toBeNull()
  expect(zip.file('images/report-2.png')).not.toBeNull()
  const again = await removeReportFromZip(res.bytes, 1, 'report-1.png')
  expect(again.removed).toBe(false)
})

function fakeDeps(r: ReportRecord | null | (() => ReportRecord | null), archives: Record<string, Uint8Array>, fail = '') {
  const calls: string[] = []
  const deps: DsarDeps = {
    getReport: async () => (typeof r === 'function' ? r() : r),
    deleteDriveFile: async (id) => {
      calls.push(`del ${id}`)
      if (fail === id) throw new Error(`Drive DELETE /files/${id} -> 500: boom`)
      if (fail === `404:${id}`) throw new Error(`Drive DELETE /files/${id} -> 404: gone`)
    },
    findArchives: async (name) => Object.keys(archives).filter((k) => k.endsWith(name)).map((k) => ({ id: k, name })),
    downloadFile: async (id) => {
      if (!(id in archives)) throw new Error(`Drive GET /files/${id}?alt=media -> 404: gone`)
      return archives[id]
    },
    uploadArchive: async (name, bytes) => { calls.push(`up ${name}`); archives[`new:${name}`] = bytes; return 'new' },
    deleteReportRow: async (id) => { calls.push(`row ${id}`); return true },
  }
  return { deps, calls }
}

test('DSAR delete: screenshot, archive entry, then the row', async () => {
  const archives: Record<string, Uint8Array> = { 'old:rosu-reports-20261001.zip': await archiveWith(5, 6) }
  const { deps, calls } = fakeDeps(report(5, { archive_ref: 'rosu-reports-20261001.zip', image_name: 'report-5.png',
    image_status: 'archived' }), archives)
  const res = await deleteReportEverywhere(deps, 5)
  expect(res).toEqual({ ok: true, imageDeleted: false, archivesChanged: 1 })
  // New archive written before the old one is removed; the row goes last.
  expect(calls).toEqual(['up rosu-reports-20261001.zip', 'del old:rosu-reports-20261001.zip', 'row 5'])
  const zip = await JSZip.loadAsync(archives['new:rosu-reports-20261001.zip'])
  expect((JSON.parse(await zip.file('reports.json')!.async('string')) as { id: number }[]).map((r) => r.id)).toEqual([6])
})

test('the last report in an archive takes the archive with it', async () => {
  const archives: Record<string, Uint8Array> = { 'old:a.zip': await archiveWith(7) }
  const { deps, calls } = fakeDeps(report(7, { archive_ref: 'a.zip', image_name: 'report-7.png' }), archives)
  expect(await deleteReportEverywhere(deps, 7)).toMatchObject({ ok: true, archivesChanged: 1 })
  expect(calls).toEqual(['del old:a.zip', 'row 7'])
})

test('a stored screenshot is deleted; "already gone" is fine; other Drive errors keep the row', async () => {
  const stored = report(8, { image_status: 'stored', image_drive_id: 'img8' })
  let t = fakeDeps(stored, {})
  expect(await deleteReportEverywhere(t.deps, 8)).toEqual({ ok: true, imageDeleted: true, archivesChanged: 0 })
  expect(t.calls).toEqual(['del img8', 'row 8'])
  t = fakeDeps(stored, {}, '404:img8')
  expect(await deleteReportEverywhere(t.deps, 8)).toMatchObject({ ok: true })
  t = fakeDeps(stored, {}, 'img8')
  expect(await deleteReportEverywhere(t.deps, 8)).toEqual({ ok: false, error: 'drive' })
  expect(t.calls).not.toContain('row 8')
  expect(await deleteReportEverywhere(fakeDeps(null, {}).deps, 9)).toEqual({ ok: false, error: 'not_found' })
})

test('a screenshot id that is still set is deleted whatever the image status says', async () => {
  const t = fakeDeps(report(10, { image_status: 'archived', image_drive_id: 'img10' }), {}, '404:img10')
  expect(await deleteReportEverywhere(t.deps, 10)).toMatchObject({ ok: true })
  expect(t.calls).toEqual(['del img10', 'row 10'])
})

test('the nightly archive taking the report mid-way: that archive is cleaned before the row goes', async () => {
  const archives: Record<string, Uint8Array> = { 'old:rosu-reports-20261020.zip': await archiveWith(11, 12) }
  let reads = 0
  const t = fakeDeps(() => (++reads === 1 ? report(11)
    : report(11, { archive_ref: 'rosu-reports-20261020.zip', image_name: 'report-11.png' })), archives)
  let rowCalls = 0
  t.deps.deleteReportRow = async (id, ref) => {
    rowCalls++
    t.calls.push(`row ${id} ${ref}`)
    return ref !== null      // the first try saw archive_ref null; the row has one now
  }
  expect(await deleteReportEverywhere(t.deps, 11)).toEqual({ ok: true, imageDeleted: false, archivesChanged: 1 })
  expect(rowCalls).toBe(2)
  expect(t.calls).toEqual(['row 11 null', 'up rosu-reports-20261020.zip', 'del old:rosu-reports-20261020.zip',
    'row 11 rosu-reports-20261020.zip'])
})

test('a row that keeps changing is reported as busy, and a row deleted meanwhile counts as done', async () => {
  const t = fakeDeps(report(13), {})
  t.deps.deleteReportRow = async () => false
  expect(await deleteReportEverywhere(t.deps, 13)).toEqual({ ok: false, error: 'busy' })
  let reads = 0
  const u = fakeDeps(() => (++reads === 1 ? report(14) : null), {})
  u.deps.deleteReportRow = async () => false
  expect(await deleteReportEverywhere(u.deps, 14)).toMatchObject({ ok: true })
})

test('an archive already gone is skipped; an unreadable one stops the deletion', async () => {
  const t = fakeDeps(report(15, { archive_ref: 'x.zip' }), {})
  t.deps.findArchives = async (name) => [{ id: 'missing', name }]
  expect(await deleteReportEverywhere(t.deps, 15)).toMatchObject({ ok: true, archivesChanged: 0 })
  const broken = fakeDeps(report(16, { archive_ref: 'y.zip' }), { 'b:y.zip': new TextEncoder().encode('not a zip') })
  expect(await deleteReportEverywhere(broken.deps, 16)).toEqual({ ok: false, error: 'archive_unreadable' })
  expect(broken.calls).not.toContain('row 16')
  const zip = new JSZip()
  zip.file('reports.json', '{"oops": true}')
  const notAList = fakeDeps(report(17, { archive_ref: 'z.zip' }),
    { 'c:z.zip': await zip.generateAsync({ type: 'uint8array' }) })
  expect(await deleteReportEverywhere(notAList.deps, 17)).toEqual({ ok: false, error: 'archive_unreadable' })
})

test('a delete request must repeat the id exactly', () => {
  expect(parseDsarRequest({ id: 5, confirm: 5 })).toBe(5)
  expect(parseDsarRequest({ id: '5', confirm: '5' })).toBe(5)
  expect(parseDsarRequest({ id: 5, confirm: 6 })).toBeNull()
  expect(parseDsarRequest({ id: 5 })).toBeNull()
  expect(parseDsarRequest({ id: 5, confirm: true })).toBeNull()        // Number(true) === 1 must not pass
  expect(parseDsarRequest({ id: 1, confirm: true })).toBeNull()
  expect(parseDsarRequest({ id: 1, confirm: [1] })).toBeNull()
  expect(parseDsarRequest({ id: 1, confirm: ' 1' })).toBeNull()
  expect(parseDsarRequest({ id: 0, confirm: 0 })).toBeNull()
  expect(parseDsarRequest({ id: 1.5, confirm: 1.5 })).toBeNull()
  expect(parseDsarRequest(null)).toBeNull()
})
