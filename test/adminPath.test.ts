// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { adminPathState, adminSlug, routeAdmin, adminApiBase, adminPageBase, gateOk, type AdminPathState } from '@/lib/adminPath'

const SLUG = 'ops-2f9c1d7e4b'
const SECRET: AdminPathState = { mode: 'secret', slug: SLUG }
const OPEN: AdminPathState = { mode: 'open' }
const LOCKED: AdminPathState = { mode: 'locked' }

test('state: unset = open, valid = secret, malformed = locked (fails closed)', () => {
  expect(adminPathState(undefined)).toEqual(OPEN)
  expect(adminPathState('')).toEqual(OPEN)
  expect(adminPathState(SLUG)).toEqual(SECRET)
  expect(adminPathState(`/${SLUG}/`)).toEqual(SECRET)
  expect(adminPathState('short')).toEqual(LOCKED)
  expect(adminPathState('has space in it!')).toEqual(LOCKED)
  expect(adminSlug(SLUG)).toBe(SLUG)
  expect(adminSlug('short')).toBeNull()
})

test('open: /admin is served as-is, never rewritten', () => {
  expect(routeAdmin('/admin', OPEN)).toEqual({ kind: 'admin', to: null, page: true })
  expect(routeAdmin('/api/admin/login', OPEN)).toEqual({ kind: 'admin', to: null, page: false })
  expect(routeAdmin('/', OPEN)).toEqual({ kind: 'pass' })
  expect(adminApiBase(null)).toBe('/api/admin')
  expect(adminPageBase(null)).toBe('/admin')
})

test('locked: every admin path is hidden', () => {
  expect(routeAdmin('/admin', LOCKED)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('/api/admin/login', LOCKED)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('/report', LOCKED)).toEqual({ kind: 'pass' })
})

test('secret: real paths hidden, secret paths mapped', () => {
  expect(routeAdmin('/admin', SECRET)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('/Admin', SECRET)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('/%61dmin', SECRET)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('//admin', SECRET)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('/api/admin/login', SECRET)).toEqual({ kind: 'not_found' })
  expect(routeAdmin(`/${SLUG}`, SECRET)).toEqual({ kind: 'admin', to: '/admin', page: true })
  expect(routeAdmin(`/${SLUG}/api/login`, SECRET)).toEqual({ kind: 'admin', to: '/api/admin/login', page: false })
  expect(routeAdmin(`/${SLUG}/api/image/12`, SECRET)).toEqual({ kind: 'admin', to: '/api/admin/image/12', page: false })
  expect(routeAdmin(`/${SLUG}/other`, SECRET)).toEqual({ kind: 'not_found' })
  expect(routeAdmin('/report', SECRET)).toEqual({ kind: 'pass' })
  expect(routeAdmin('/administrator', SECRET)).toEqual({ kind: 'pass' })
  expect(adminApiBase(SLUG)).toBe(`/${SLUG}/api`)
})

test('secret: dot segments and double encoding never resolve out of the slug', () => {
  expect(routeAdmin(`/${SLUG}/api/%252e%252e/%252e%252e/admin`, SECRET)).toEqual({ kind: 'not_found' })
  expect(routeAdmin(`/${SLUG}/api/%2e%2e/cron/archive`, SECRET)).toEqual({ kind: 'not_found' })
  expect(routeAdmin(`/${SLUG}/api/../../admin`, SECRET)).toEqual({ kind: 'not_found' })
  expect(routeAdmin(`/${SLUG}/api/login%2f..`, SECRET)).toEqual({ kind: 'not_found' })
})

test('gate header: required (and must match) only in secret mode', () => {
  expect(gateOk(null, OPEN)).toBe(true)
  expect(gateOk(null, SECRET)).toBe(false)
  expect(gateOk('guess', SECRET)).toBe(false)
  expect(gateOk(SLUG, SECRET)).toBe(true)
  expect(gateOk(SLUG, LOCKED)).toBe(false)
})
