// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { lookupReportStatus } from '@/lib/reportStatus'
import type { ReportRecord } from '@/lib/db'

const TOKEN = 'A'.repeat(43)
const report = { id: 7 } as ReportRecord

describe('lookupReportStatus', () => {
  it('returns the report when found, looked up by the SHA-256 of the token', async () => {
    const find = vi.fn().mockResolvedValue(report)
    expect(await lookupReportStatus(TOKEN, { find })).toEqual({ state: 'found', report })
    expect(find).toHaveBeenCalledWith(createHash('sha256').update(TOKEN).digest('hex'))
    expect(find).not.toHaveBeenCalledWith(TOKEN)
  })

  it('is missing when no row matches', async () => {
    expect(await lookupReportStatus(TOKEN, { find: async () => null })).toEqual({ state: 'missing' })
  })

  it('is missing for a malformed token without calling find', async () => {
    const find = vi.fn()
    expect(await lookupReportStatus('short', { find })).toEqual({ state: 'missing' })
    expect(find).not.toHaveBeenCalled()
  })

  it('is an error when find rejects or throws', async () => {
    expect(await lookupReportStatus(TOKEN, { find: () => Promise.reject(new Error('db down')) })).toEqual({ state: 'error' })
    expect(await lookupReportStatus(TOKEN, { find: () => { throw new Error('sync') } })).toEqual({ state: 'error' })
  })
})
