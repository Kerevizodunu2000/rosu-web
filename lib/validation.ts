// SPDX-License-Identifier: GPL-3.0-or-later
export const LIMITS = { title: 200, description: 5000, contact: 200, imageBytes: 6 * 1024 * 1024 } as const

export const ALLOWED_MIME: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
  'image/webp': 'webp', 'image/bmp': 'bmp',
}

export type ParsedReport = {
  title: string; description: string; contact: string
  appVersion: string; os: string; lang: string
  token: string; hp: string
  image: { b64: string; mime: string } | null
}

const s = (v: unknown) => (typeof v === 'string' ? v : '')
const clip = (v: unknown, n: number) => s(v).slice(0, n)

export function parseReport(raw: unknown):
  | { ok: true; value: ParsedReport } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: 'bad_json' }
  const d = raw as Record<string, unknown>
  const title = s(d.title).trim().slice(0, LIMITS.title)
  const description = s(d.description).trim().slice(0, LIMITS.description)
  if (!title || !description) return { ok: false, error: 'missing_fields' }
  let image: ParsedReport['image'] = null
  const mime = s(d.image_mime)
  if (s(d.image_b64) && ALLOWED_MIME[mime]) image = { b64: s(d.image_b64), mime }
  return {
    ok: true,
    value: {
      title, description,
      contact: s(d.contact).trim().slice(0, LIMITS.contact),
      appVersion: clip(d.app_version, 40), os: clip(d.os, 120), lang: clip(d.lang, 10),
      token: s(d.token), hp: s(d.hp), image,
    },
  }
}

export function imageMagicOk(b: Uint8Array, mime: string): boolean {
  const has = (...sig: number[]) => sig.every((v, i) => b[i] === v)
  switch (mime) {
    case 'image/png':  return has(0x89, 0x50, 0x4e, 0x47)
    case 'image/jpeg': return has(0xff, 0xd8, 0xff)
    case 'image/gif':  return has(0x47, 0x49, 0x46, 0x38)
    case 'image/webp': return has(0x52, 0x49, 0x46, 0x46) // "RIFF" (WEBP at 8)
    case 'image/bmp':  return has(0x42, 0x4d)
    default: return false
  }
}

export function safeImageName(mime: string, id: number | string): string {
  return `rosu-${id}.${ALLOWED_MIME[mime] ?? 'png'}`
}
