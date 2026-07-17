// SPDX-License-Identifier: GPL-3.0-or-later
import JSZip from 'jszip'
export type ZipReport = { id: number; [k: string]: unknown }
type Entry = { report: ZipReport; image?: { name: string; bytes: Uint8Array } }

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function buildReportsZip(entries: Entry[]): Promise<Uint8Array> {
  const zip = new JSZip()
  const reports = entries.map((e) => e.report)
  zip.file('reports.json', JSON.stringify(reports, null, 2))
  const cols = Array.from(reports.reduce((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set }, new Set<string>()))
  const rows = [cols.join(','), ...reports.map((r) => cols.map((c) => csvCell(r[c])).join(','))]
  zip.file('reports.csv', rows.join('\n'))
  for (const e of entries) if (e.image) zip.file(`images/${e.image.name}`, e.image.bytes)
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
}
