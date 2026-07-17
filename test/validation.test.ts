// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { parseReport, imageMagicOk, safeImageName, ALLOWED_MIME } from '@/lib/validation'

test('rejects non-object', () => {
  expect(parseReport(null).ok).toBe(false)
  expect(parseReport('x').ok).toBe(false)
  expect(parseReport(42).ok).toBe(false)
})
test('rejects missing title/description', () => {
  expect(parseReport({ title: '', description: 'd' })).toEqual({ ok: false, error: 'missing_fields' })
  expect(parseReport({ title: 't', description: '  ' })).toEqual({ ok: false, error: 'missing_fields' })
})
test('trims and clips to limits', () => {
  const r = parseReport({ title: ' hi ', description: 'x'.repeat(6000), contact: ' a@b.co ' })
  expect(r.ok).toBe(true)
  if (r.ok) {
    expect(r.value.title).toBe('hi')
    expect(r.value.description.length).toBe(5000)
    expect(r.value.contact).toBe('a@b.co')
    expect(r.value.image).toBeNull()
  }
})
test('keeps honeypot + token + image when present', () => {
  const r = parseReport({ title: 't', description: 'd', hp: 'bot', token: 'k',
    image_b64: 'AAAA', image_mime: 'image/png' })
  expect(r.ok && r.value.hp).toBe('bot')
  expect(r.ok && r.value.image?.mime).toBe('image/png')
})
test('drops image with disallowed mime', () => {
  const r = parseReport({ title: 't', description: 'd', image_b64: 'AAAA', image_mime: 'image/tiff' })
  expect(r.ok && r.value.image).toBeNull()
})
test('imageMagicOk checks signatures', () => {
  expect(imageMagicOk(new Uint8Array([0x89,0x50,0x4e,0x47]), 'image/png')).toBe(true)
  expect(imageMagicOk(new Uint8Array([0xff,0xd8,0xff]), 'image/jpeg')).toBe(true)
  expect(imageMagicOk(new Uint8Array([0x00,0x01]), 'image/png')).toBe(false)
})
test('webp magic requires WEBP at offset 8, not just RIFF', () => {
  const riffOnly = new Uint8Array([0x52,0x49,0x46,0x46, 0,0,0,0, 0,0,0,0]) // RIFF container, not WEBP (e.g. WAV/AVI)
  const webp = new Uint8Array([0x52,0x49,0x46,0x46, 0,0,0,0, 0x57,0x45,0x42,0x50])
  expect(imageMagicOk(riffOnly, 'image/webp')).toBe(false)
  expect(imageMagicOk(webp, 'image/webp')).toBe(true)
})
test('safeImageName ignores caller name', () => {
  expect(safeImageName('image/jpeg', 12)).toBe('rosu-12.jpg')
  expect(ALLOWED_MIME['image/webp']).toBe('webp')
})
