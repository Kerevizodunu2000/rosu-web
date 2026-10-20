// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { adminSlug, routeAdmin, adminApiBase, adminPageBase } from '@/lib/adminPath'

const SLUG = 'ops-2f9c1d7e4b'

test('slug validation', () => {
  expect(adminSlug(undefined)).toBeNull()
  expect(adminSlug('')).toBeNull()
  expect(adminSlug(SLUG)).toBe(SLUG)
  expect(adminSlug(`/${SLUG}/`)).toBe(SLUG)
  expect(adminSlug('short')).toBeNull()
  expect(adminSlug('has space in it!')).toBeNull()
})

test('without a slug: /admin is served as before', () => {
  expect(routeAdmin('/admin', null)).toEqual({ kind: 'rewrite', to: '/admin', page: true })
  expect(routeAdmin('/api/admin/login', null)).toEqual({ kind: 'pass' })
  expect(routeAdmin('/', null)).toEqual({ kind: 'pass' })
  expect(adminApiBase(null)).toBe('/api/admin')
  expect(adminPageBase(null)).toBe('/admin')
})

test('with a slug: real paths hidden, secret paths mapped', () => {
  expect(routeAdmin('/admin', SLUG)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('/Admin', SLUG)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('/%61dmin', SLUG)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('//admin', SLUG)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('/api/admin/login', SLUG)).toEqual({ kind: 'not_found' })
  expect(routeAdmin(`/${SLUG}`, SLUG)).toEqual({ kind: 'rewrite', to: '/admin', page: true })
  expect(routeAdmin(`/${SLUG}/api/login`, SLUG)).toEqual({ kind: 'rewrite', to: '/api/admin/login', page: false })
  expect(routeAdmin(`/${SLUG}/api/image/12`, SLUG)).toEqual({ kind: 'rewrite', to: '/api/admin/image/12', page: false })
  expect(routeAdmin(`/${SLUG}/other`, SLUG)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('/report', SLUG)).toEqual({ kind: 'pass' })
  expect(routeAdmin('/administrator', SLUG)).toEqual({ kind: 'pass' })
  expect(adminApiBase(SLUG)).toBe(`/${SLUG}/api`)
})
