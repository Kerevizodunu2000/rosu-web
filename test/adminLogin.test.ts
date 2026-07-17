// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { passwordOk } from '@/lib/adminAuth'
test('passwordOk', () => {
  expect(passwordOk('secret', 'secret')).toBe(true)
  expect(passwordOk('secret', 'nope')).toBe(false)
  expect(passwordOk('x', '')).toBe(false) // unset password never grants access
})
