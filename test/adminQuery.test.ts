// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { adminHref, likePattern, pageCount, parseAdminQuery, PAGE_SIZE, Q_MAX } from '@/lib/adminQuery'

test('the admin URL state is parsed strictly', () => {
  expect(parseAdminQuery({})).toEqual({ view: 'unarchived', q: '', status: null, source: null, page: 1 })
  expect(parseAdminQuery({ view: 'all', q: '  crash   on  start ', status: 'fixed', source: 'app', page: '3' }))
    .toEqual({ view: 'all', q: 'crash on start', status: 'fixed', source: 'app', page: 3 })
  // Junk falls back to defaults instead of reaching SQL.
  expect(parseAdminQuery({ view: 'x', status: "fixed' OR 1=1", source: 'mail', page: '-2' }))
    .toEqual({ view: 'unarchived', q: '', status: null, source: null, page: 1 })
  expect(parseAdminQuery({ page: '1e9' }).page).toBe(1)
  expect(parseAdminQuery({ q: ['a', 'b'] }).q).toBe('a')
  expect(parseAdminQuery({ q: 'x'.repeat(500) }).q).toHaveLength(Q_MAX)
})

test('links keep the filters and drop defaults', () => {
  const q = parseAdminQuery({ view: 'all', q: 'a&b', status: 'closed', page: '2' })
  expect(adminHref('/admin', q)).toBe('/admin?view=all&q=a%26b&status=closed&page=2')
  expect(adminHref('/admin', q, { page: 1, view: 'unarchived' })).toBe('/admin?q=a%26b&status=closed')
  expect(adminHref('/s3cret', parseAdminQuery({}))).toBe('/s3cret')
})

test('ILIKE patterns take the user’s wildcards literally', () => {
  expect(likePattern('')).toBeNull()
  expect(likePattern('50%_off\\')).toBe('%50\\%\\_off\\\\%')
})

test('page count', () => {
  expect(pageCount(0)).toBe(1)
  expect(pageCount(PAGE_SIZE)).toBe(1)
  expect(pageCount(PAGE_SIZE + 1)).toBe(2)
})
