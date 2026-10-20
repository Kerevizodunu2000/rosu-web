// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { parseMarkdown, parseInline, safeHref, slugify } from '@/lib/markdown'

test('blocks: headings, lists, code, quotes, rules, paragraphs', () => {
  const b = parseMarkdown('# Title\n\nSome *text* here\ncontinued.\n\n- a\n- b\n  more b\n\n1. one\n2. two\n\n```ts\nconst x = 1\n```\n\n> quoted\n\n---')
  expect(b.map((x) => x.t)).toEqual(['h', 'p', 'ul', 'ol', 'code', 'quote', 'hr'])
  expect(b[0]).toMatchObject({ t: 'h', level: 1, id: 'title' })
  expect(b[2]).toMatchObject({ t: 'ul', items: [[{ t: 'text', v: 'a' }], [{ t: 'text', v: 'b more b' }]] })
  expect(b[4]).toEqual({ t: 'code', lang: 'ts', v: 'const x = 1' })
})

test('inline: bold, italic, code, links and escapes', () => {
  expect(parseInline('**b** _i_ `c` [x](https://a.b/c)')).toEqual([
    { t: 'strong', c: [{ t: 'text', v: 'b' }] }, { t: 'text', v: ' ' },
    { t: 'em', c: [{ t: 'text', v: 'i' }] }, { t: 'text', v: ' ' },
    { t: 'code', v: 'c' }, { t: 'text', v: ' ' },
    { t: 'link', href: 'https://a.b/c', c: [{ t: 'text', v: 'x' }] },
  ])
  expect(parseInline('snake_case_name stays')).toEqual([{ t: 'text', v: 'snake_case_name stays' }])
  expect(parseInline('\\*not em\\*')).toEqual([{ t: 'text', v: '*not em*' }])
})

test('dangerous links never become links; raw HTML stays text', () => {
  expect(parseInline('[x](javascript:alert(1))')).not.toContainEqual(expect.objectContaining({ t: 'link' }))
  expect(parseInline('[x](data:text/html,hi)')).toEqual([{ t: 'text', v: 'x' }])
  expect(parseMarkdown('<script>alert(1)</script>')).toEqual([{ t: 'p', c: [{ t: 'text', v: '<script>alert(1)</script>' }] }])
  expect(safeHref('//evil.example')).toBeNull()
  expect(safeHref('/docs/api')).toBe('/docs/api')
  expect(safeHref('#top')).toBe('#top')
})

test('slugify', () => {
  expect(slugify('Hello, World! `x`')).toBe('hello-world-x')
})
