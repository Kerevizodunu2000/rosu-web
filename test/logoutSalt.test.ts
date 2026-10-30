// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { hashIp } from '@/lib/crypto'

const m = vi.hoisted(() => ({ insertAudit: vi.fn(), revokeAdminSessionFamily: vi.fn(), revokeAllAdminSessions: vi.fn() }))
vi.mock('@/lib/db', () => m)
vi.mock('@/lib/adminGuard', () => ({
  requireAdmin: async () => ({ ok: true, sql: {}, claims: { family: 'F' } }),
}))

import { POST } from '@/app/api/admin/logout/route'

const req = () => new NextRequest('http://x.test/api/admin/logout', {
  method: 'POST', body: '{}', headers: { 'x-forwarded-for': '1.2.3.4' },
})
beforeEach(() => { vi.clearAllMocks() })
afterEach(() => { vi.unstubAllEnvs() })

test('a missing salt answers 503 before anything is revoked', async () => {
  vi.stubEnv('IP_HASH_SALT', '')
  const res = await POST(req())
  expect(res.status).toBe(503)
  expect(await res.json()).toEqual({ ok: false, error: 'unavailable' })
  expect(m.revokeAdminSessionFamily).not.toHaveBeenCalled()
  expect(m.revokeAllAdminSessions).not.toHaveBeenCalled()
  expect(m.insertAudit).not.toHaveBeenCalled()
})

test('with the salt set the audit hash uses it', async () => {
  vi.stubEnv('IP_HASH_SALT', 'pepper')
  const res = await POST(req())
  expect(res.status).toBe(200)
  expect(m.revokeAdminSessionFamily).toHaveBeenCalledOnce()
  const hash = m.insertAudit.mock.calls[0][2]
  expect(hash).toBe(hashIp('login:1.2.3.4', 'pepper'))
  expect(hash).not.toBe(hashIp('login:1.2.3.4', ''))
})
