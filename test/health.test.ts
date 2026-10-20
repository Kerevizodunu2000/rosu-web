// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { dbHealth } from '@/lib/health'

test('dbHealth: ok, failing and hanging probes', async () => {
  expect(await dbHealth(async () => 1)).toBe('ok')
  expect(await dbHealth(async () => { throw new Error('down') })).toBe('down')
  expect(await dbHealth(() => new Promise(() => {}), 20)).toBe('down')
})
