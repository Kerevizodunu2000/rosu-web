// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { migrateIfNeeded } from '@/lib/schema'
import { SCHEMA_STATEMENTS, SCHEMA_VERSION } from '@/db/schema.mjs'

test('migrates a fresh database (no schema_meta) and an old one, skips a current one', async () => {
  let applied = 0
  const apply = async () => { applied++ }
  expect(await migrateIfNeeded({ readVersion: async () => { throw new Error('relation does not exist') }, apply })).toBe(true)
  expect(await migrateIfNeeded({ readVersion: async () => null, apply })).toBe(true)
  expect(await migrateIfNeeded({ readVersion: async () => SCHEMA_VERSION - 1, apply })).toBe(true)
  expect(await migrateIfNeeded({ readVersion: async () => SCHEMA_VERSION, apply })).toBe(false)
  expect(applied).toBe(3)
})

test('every statement is re-runnable', () => {
  for (const s of SCHEMA_STATEMENTS) {
    expect(s, s).toMatch(/IF NOT EXISTS/i)
  }
})
