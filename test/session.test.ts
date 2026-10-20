// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import {
  issueSession, verifySession, readSessionToken, rotateIfDue, type SessionStore,
  SESSION_IDLE_SECONDS, SESSION_MAX_SECONDS, ROTATE_AFTER_SECONDS, ROTATION_GRACE_SECONDS,
} from '@/lib/session'

const SECRET = 'secret-value-32-bytes-minimum-xxxx'

function memStore(clock: { now: number }) {
  const rows = new Map<string, { authTime: string; expiresAt: string; revoked: boolean }>()
  const store: SessionStore = {
    insert: async (v) => { rows.set(v.id, { authTime: v.authTime, expiresAt: v.expiresAt, revoked: false }) },
    isLive: async (id) => {
      const r = rows.get(id)
      return !!r && !r.revoked && Date.parse(r.expiresAt) > clock.now
    },
    expireAt: async (id, at) => {
      const r = rows.get(id)
      if (r && Date.parse(at) < Date.parse(r.expiresAt)) r.expiresAt = at
    },
  }
  return { store, rows }
}

test('issued session verifies; wrong secret, garbage and missing do not', async () => {
  const clock = { now: Date.UTC(2026, 9, 20, 12) }
  const { store } = memStore(clock)
  const s = await issueSession(store, SECRET, { nowMs: clock.now })
  expect(s.maxAge).toBe(SESSION_IDLE_SECONDS)
  expect(await verifySession(store, s.token, SECRET, clock.now)).not.toBeNull()
  expect(await verifySession(store, s.token, 'different-secret-32-bytes-minimum!', clock.now)).toBeNull()
  expect(await verifySession(store, undefined, SECRET, clock.now)).toBeNull()
  expect(await verifySession(store, 'garbage', SECRET, clock.now)).toBeNull()
})

test('a revoked (logged-out) session is dead even with a valid signature', async () => {
  const clock = { now: Date.UTC(2026, 9, 20, 12) }
  const { store, rows } = memStore(clock)
  const s = await issueSession(store, SECRET, { nowMs: clock.now })
  rows.get(s.sid)!.revoked = true
  expect(await readSessionToken(s.token, SECRET, clock.now)).not.toBeNull()
  expect(await verifySession(store, s.token, SECRET, clock.now)).toBeNull()
})

test('idle timeout ends a session', async () => {
  const clock = { now: Date.UTC(2026, 9, 20, 12) }
  const { store } = memStore(clock)
  const s = await issueSession(store, SECRET, { nowMs: clock.now })
  clock.now += (SESSION_IDLE_SECONDS + 1) * 1000
  expect(await verifySession(store, s.token, SECRET, clock.now)).toBeNull()
})

test('rotation: new id after ROTATE_AFTER, old id lapses after the grace window', async () => {
  const clock = { now: Date.UTC(2026, 9, 20, 12) }
  const { store } = memStore(clock)
  const first = await issueSession(store, SECRET, { nowMs: clock.now })
  expect(await rotateIfDue(store, first.token, SECRET, clock.now)).toBeNull() // too fresh
  clock.now += (ROTATE_AFTER_SECONDS + 1) * 1000
  const next = await rotateIfDue(store, first.token, SECRET, clock.now)
  expect(next).not.toBeNull()
  expect(next!.sid).not.toBe(first.sid)
  // Old cookie still works for in-flight requests…
  expect(await verifySession(store, first.token, SECRET, clock.now)).not.toBeNull()
  clock.now += (ROTATION_GRACE_SECONDS + 1) * 1000
  // …then dies, while the new one lives on with the original sign-in time.
  expect(await verifySession(store, first.token, SECRET, clock.now)).toBeNull()
  const claims = await verifySession(store, next!.token, SECRET, clock.now)
  expect(claims?.authTime).toBe(Math.floor(Date.UTC(2026, 9, 20, 12) / 1000))
})

test('rotation never extends past the absolute 12 h cap', async () => {
  const start = Date.UTC(2026, 9, 20, 0)
  const clock = { now: start }
  const { store } = memStore(clock)
  let token = (await issueSession(store, SECRET, { nowMs: clock.now })).token
  // Stay active: rotate every 16 minutes for 13 hours.
  for (let i = 0; i < 49; i++) {
    clock.now += 16 * 60 * 1000
    const r = await rotateIfDue(store, token, SECRET, clock.now)
    if (r) token = r.token
  }
  expect(clock.now - start).toBeGreaterThan(SESSION_MAX_SECONDS * 1000)
  expect(await verifySession(store, token, SECRET, clock.now)).toBeNull()
})
