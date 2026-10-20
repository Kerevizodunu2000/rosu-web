// SPDX-License-Identifier: GPL-3.0-or-later
import JSZip from 'jszip'
export type ZipReport = { id: number; [k: string]: unknown }
type Entry = { report: ZipReport; image?: { name: string; bytes: Uint8Array } }

const csvCell = (v: unknown) => {
  let s = v == null ? '' : String(v)
  // Neutralize spreadsheet formula/DDE injection: a cell that begins with
  // =, +, -, @, tab or CR is executed as a formula by Excel/Sheets. The report
  // title/description are fully attacker-controlled, so prefix such cells with a
  // single quote before the normal quote-escaping.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function reportsCsv(reports: ZipReport[]): string {
  const cols = Array.from(reports.reduce((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set }, new Set<string>()))
  return [cols.join(','), ...reports.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n')
}

export async function buildReportsZip(entries: Entry[]): Promise<Uint8Array> {
  const zip = new JSZip()
  const reports = entries.map((e) => e.report)
  zip.file('reports.json', JSON.stringify(reports, null, 2))
  zip.file('reports.csv', reportsCsv(reports))
  for (const e of entries) if (e.image) zip.file(`images/${e.image.name}`, e.image.bytes)
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
}

/**
 * Take one report out of a daily archive (the DSAR delete, v1.5): its entry in
 * reports.json and reports.csv, and its screenshot. ``removed`` is false when
 * the archive never held it; ``remaining`` is how many reports are left (zero
 * means the caller should delete the archive rather than keep an empty one).
 */
export async function removeReportFromZip(bytes: Uint8Array, id: number, imageName: string | null):
  Promise<{ bytes: Uint8Array; removed: boolean; remaining: number }> {
  const zip = await JSZip.loadAsync(bytes)
  const json = zip.file('reports.json')
  if (!json) return { bytes, removed: false, remaining: -1 }
  const parsed = JSON.parse(await json.async('string')) as unknown
  const reports = Array.isArray(parsed) ? (parsed as ZipReport[]) : []
  const kept = reports.filter((r) => Number(r?.id) !== id)
  const image = imageName ? zip.file(`images/${imageName}`) : null
  if (kept.length === reports.length && !image) return { bytes, removed: false, remaining: reports.length }
  zip.file('reports.json', JSON.stringify(kept, null, 2))
  zip.file('reports.csv', reportsCsv(kept))
  if (image) zip.remove(`images/${imageName}`)
  const out = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
  return { bytes: out, removed: true, remaining: kept.length }
}
