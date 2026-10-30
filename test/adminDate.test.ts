// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it } from 'vitest'
import { formatAdminDate } from '@/lib/adminQuery'

describe('formatAdminDate', () => {
  it('formats in UTC, en-GB', () => {
    expect(formatAdminDate('2026-01-02T23:30:00Z')).toBe('2 Jan 2026, 23:30 UTC')
  })
  it('returns an invalid string unchanged', () => {
    expect(formatAdminDate('not a date')).toBe('not a date')
  })
})
