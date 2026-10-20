// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { alternates, localePath, splitLocale, LOCALES } from '@/lib/i18n'
import { en } from '@/content/i18n/en'
import { tr } from '@/content/i18n/tr'
import { ja } from '@/content/i18n/ja'
import { fmt } from '@/content/i18n'

test('paths per language', () => {
  expect(localePath('en', '/docs')).toBe('/docs')
  expect(localePath('tr', '/docs')).toBe('/tr/docs')
  expect(localePath('ja', '/')).toBe('/ja')
  expect(localePath('tr', '/#features')).toBe('/tr#features')
  expect(localePath('tr', '/report?x=1')).toBe('/tr/report?x=1')
  expect(localePath('tr', 'https://example.com/a')).toBe('https://example.com/a')
  expect(localePath('tr', '//evil.example/a')).toBe('//evil.example/a')
})

test('splitting a path back into language + page', () => {
  expect(splitLocale('/tr/docs')).toEqual({ locale: 'tr', path: '/docs' })
  expect(splitLocale('/ja')).toEqual({ locale: 'ja', path: '/' })
  expect(splitLocale('/docs')).toEqual({ locale: 'en', path: '/docs' })
  expect(splitLocale('/en/docs')).toEqual({ locale: 'en', path: '/en/docs' })   // English has no prefix
  expect(splitLocale('/travel')).toEqual({ locale: 'en', path: '/travel' })
  for (const l of LOCALES) expect(splitLocale(localePath(l, '/tools/share-card')).path).toBe('/tools/share-card')
})

test('every page names all its language versions', () => {
  const a = alternates('tr', '/docs')
  expect(a.canonical).toBe('/tr/docs')
  expect(a.languages).toEqual({ 'en-GB': '/docs', 'tr-TR': '/tr/docs', 'ja-JP': '/ja/docs', 'x-default': '/docs' })
})

// Walks two dictionaries side by side: same shape, same list lengths, and the
// same {placeholders} in every string (a translation that drops {n} shows
// the reader a sentence without its number).
function compare(a: unknown, b: unknown, path: string, out: string[]) {
  if (typeof a === 'string') {
    if (typeof b !== 'string') { out.push(`${path}: not a string`); return }
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')
    if (ph(a) !== ph(b)) out.push(`${path}: placeholders ${ph(a)} vs ${ph(b)}`)
    const links = (s: string) => [...s.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).sort().join(',')
    if (links(a) !== links(b)) out.push(`${path}: links ${links(a)} vs ${links(b)}`)
    return
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) { out.push(`${path}: not a list`); return }
    // Legal summaries exist only where they are needed (Japanese).
    if (!path.endsWith('Summary') && a.length !== b.length) out.push(`${path}: ${a.length} vs ${b.length} items`)
    if (!path.endsWith('Summary')) a.forEach((x, i) => compare(x, b[i], `${path}[${i}]`, out))
    return
  }
  if (a && typeof a === 'object') {
    for (const k of Object.keys(a)) compare((a as Record<string, unknown>)[k], (b as Record<string, unknown>)?.[k], `${path}.${k}`, out)
  }
}

test('Turkish and Japanese match the English dictionary', () => {
  for (const [name, d] of [['tr', tr], ['ja', ja]] as const) {
    const problems: string[] = []
    compare(en, d, name, problems)
    expect(problems).toEqual([])
  }
})

test('placeholders are filled, unknown ones kept', () => {
  expect(fmt('{n} of {total}', { n: 1 })).toBe('1 of {total}')
})
