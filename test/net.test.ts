// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { ipBucket } from '@/lib/net'

test('IPv4 keys on the address', () => {
  expect(ipBucket('203.0.113.7')).toBe('203.0.113.7')
  expect(ipBucket('::ffff:203.0.113.7')).toBe('203.0.113.7')
})

test('IPv6 keys on the /64 so rotating inside it does not help', () => {
  const a = ipBucket('2001:db8:abcd:12::1')
  expect(a).toBe('2001:db8:abcd:12::/64')
  expect(ipBucket('2001:0db8:abcd:0012:ffff:ffff:ffff:ffff')).toBe(a)
  expect(ipBucket('[2001:db8:abcd:12::99]')).toBe(a)
  expect(ipBucket('2001:db8:abcd:13::1')).not.toBe(a)
  expect(ipBucket('::1')).toBe('0:0:0:0::/64')
})

test('garbage passes through unchanged (still hashed by the caller)', () => {
  expect(ipBucket('not-an-ip')).toBe('not-an-ip')
  expect(ipBucket('0.0.0.0')).toBe('0.0.0.0')
})
