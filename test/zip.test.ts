// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import JSZip from 'jszip'
import { buildReportsZip } from '@/lib/zip'
test('bundles json, csv, and images', async () => {
  const bytes = await buildReportsZip([
    { report: { id: 1, title: 'a,b', description: 'd' }, image: { name: 'rosu-1.png', bytes: new Uint8Array([1,2,3]) } },
    { report: { id: 2, title: 'x', description: 'y' } },
  ])
  const zip = await JSZip.loadAsync(bytes)
  expect(zip.file('reports.json')).toBeTruthy()
  expect(zip.file('images/rosu-1.png')).toBeTruthy()
  const csv = await zip.file('reports.csv')!.async('string')
  expect(csv).toContain('"a,b"') // comma-containing field is quoted
})
test('neutralizes CSV formula injection', async () => {
  const bytes = await buildReportsZip([{ report: { id: 1, title: '=1+2', description: '@SUM(A1)' } }])
  const zip = await JSZip.loadAsync(bytes)
  const csv = await zip.file('reports.csv')!.async('string')
  // Cells starting with a formula char are prefixed with ' so Excel/Sheets won't execute them.
  expect(csv).toContain("'=1+2")
  expect(csv).toContain("'@SUM(A1)")
})
