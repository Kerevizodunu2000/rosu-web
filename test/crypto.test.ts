// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { hashIp, constantTimeEqual } from '@/lib/crypto'
test('hashIp is deterministic, salted, not the raw ip', () => {
  const a = hashIp('1.2.3.4', 'salt'); const b = hashIp('1.2.3.4', 'salt')
  expect(a).toBe(b); expect(a).not.toContain('1.2.3.4')
  expect(a).not.toBe(hashIp('1.2.3.4', 'other')); expect(a).toHaveLength(64)
})
test('constantTimeEqual', () => {
  expect(constantTimeEqual('abc', 'abc')).toBe(true)
  expect(constantTimeEqual('abc', 'abd')).toBe(false)
  expect(constantTimeEqual('abc', 'abcd')).toBe(false)
})
