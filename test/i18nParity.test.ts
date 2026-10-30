// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { en } from '@/content/i18n/en'
import { tr } from '@/content/i18n/tr'
import { ja } from '@/content/i18n/ja'

// Compares two dictionaries in both directions (missing and extra keys, at every
// level, including objects inside lists) and reports every '' string value.
// Placeholder and link checks stay in i18n.test.ts.
function parity(a: unknown, b: unknown, path: string, out: string[]) {
  const empty = (v: unknown, side: 'a' | 'b') => { if (v === '') out.push(`${path}: empty (${side})`) }
  if (typeof a === 'string' || typeof b === 'string') {
    if (typeof a !== typeof b) out.push(`${path}: shape differs`)
    empty(a, 'a'); empty(b, 'b'); return
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) { out.push(`${path}: list vs non-list`); return }
    if (path.endsWith('Summary')) return   // legal summaries exist only where needed (Japanese)
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (i >= a.length) out.push(`${path}[${i}]: missing from first`)
      else if (i >= b.length) out.push(`${path}[${i}]: missing from second`)
      else parity(a[i], b[i], `${path}[${i}]`, out)
    }
    return
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const x = a as Record<string, unknown>, y = b as Record<string, unknown>
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      if (!Object.hasOwn(x, k)) out.push(`${path}.${k}: missing from first`)
      else if (!Object.hasOwn(y, k)) out.push(`${path}.${k}: missing from second`)
      else parity(x[k], y[k], `${path}.${k}`, out)
    }
    return
  }
  if (a !== b) out.push(`${path}: shape differs`)
}

// Deliberately empty values (dictionary.path).
const ALLOWED_EMPTY = [
  'en.legal.prevails',    // only the Japanese legal pages need a "which version prevails" line
  'tr.legal.prevails',    // same
  'tr.home.heroBefore',   // Turkish word order puts the whole hero phrase after the highlight
  'ja.home.heroBefore',   // Japanese word order does the same
]

// Walks en against `d`; "(a)"/"(b)" sides become dictionary names, allowlisted empties are dropped.
function problems(name: 'tr' | 'ja', d: unknown) {
  const out: string[] = []
  parity(en, d, '', out)
  return out
    .map((p) => p.replace(/^\.(.*): empty \(([ab])\)$/, (_, path, side) => `${side === 'a' ? 'en' : name}.${path}: empty`))
    .filter((p) => !ALLOWED_EMPTY.includes(p.replace(/: empty$/, '')))
}

test('Turkish and Japanese have the same keys as English and no stray empty strings', () => {
  expect(problems('tr', tr)).toEqual([])
  expect(problems('ja', ja)).toEqual([])
})

test('the walker reports missing, extra and empty values', () => {
  const out: string[] = []
  parity({ a: 'x', b: { c: 'y' }, l: [{ k: 'z' }] }, { a: 'x', b: {}, d: 'w', l: [{}] }, '', out)
  expect(out).toContain('.b.c: missing from second')
  expect(out).toContain('.d: missing from first')
  expect(out).toContain('.l[0].k: missing from second')
  const shape: string[] = []
  parity({ a: { b: 'x' }, l: ['x'] }, { a: 'y', l: 'z' }, '', shape)
  expect(shape).toEqual(['.a: shape differs', '.l: shape differs'])
  const e: string[] = []
  parity({ a: 'x' }, { a: '' }, '', e)
  expect(e).toEqual(['.a: empty (b)'])
})
