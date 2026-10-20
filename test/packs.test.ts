// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { compactRanges, packReport, packUrl, parsePackName } from '@/lib/packs'

test('pack names parse like the desktop app', () => {
  expect(parsePackName('S1234 - Beatmap Pack #1234.zip')).toEqual({ series: 'S', number: 1234, code: 'S1234' })
  expect(parsePackName('C:\\Packs\\SM45 - osu!mania Beatmap Pack #45 (2).7z')).toEqual({ series: 'SM', number: 45, code: 'SM45' })
  expect(parsePackName('r290 - Spotlights Winter 2023 (osu!mania).zip')?.code).toBe('R290')
  expect(parsePackName('S77.zip')?.code).toBe('S77')
  expect(parsePackName('my favourite maps.zip')).toBeNull()
  expect(parsePackName('S0 - x.zip')).toBeNull()
})

test('interior gaps of standard series only; other series are listed', () => {
  const r = packReport(['S1 - a.zip', 'S2 - a.zip', 'S5 - a.zip', 'S5 - a (2).zip', 'SM10 - x.zip',
    'SM12 - x.zip', 'R290 - y.zip', 'R300 - y.zip', 'readme.txt', ''])
  expect(r.standard).toEqual([
    { series: 'S', owned: 3, lowest: 1, highest: 5, missing: [3, 4] },
    { series: 'SM', owned: 2, lowest: 10, highest: 12, missing: [11] },
  ])
  expect(r.other).toEqual([{ series: 'R', owned: 2 }])          // never guessed red
  expect(r.unrecognised).toBe(1)
  expect(r.total).toBe(7)
  expect(r.truncated).toBe(false)
})

test('dates, timestamps and unfinished downloads are not packs', () => {
  expect(parsePackName('S20240101 - holiday photos.zip')).toBeNull()      // would be a 20M-number gap
  expect(parsePackName('S99999 - x.zip')?.number).toBe(99999)
  expect(parsePackName('S12 - Beatmap Pack #12.zip.crdownload')).toBeNull()
  expect(parsePackName('S12 - Beatmap Pack #12.zip.part')).toBeNull()
  const r = packReport(['S1 - a.zip', 'S900000000 - x.zip'])
  expect(r.standard[0].missing).toEqual([])
  expect(r.unrecognised).toBe(1)
})

test('a very long pasted line is cut before it is parsed', () => {
  const t0 = Date.now()
  expect(parsePackName('S1 - a' + ' '.repeat(80_000) + '!')).not.toBeUndefined()
  expect(Date.now() - t0).toBeLessThan(500)
})

test('copyable ranges and pack links', () => {
  expect(compactRanges('S', [3, 4, 5, 9, 11, 12])).toBe('S3–S5, S9, S11–S12')
  expect(packUrl('S1234')).toBe('https://osu.ppy.sh/beatmaps/packs/S1234')
})
