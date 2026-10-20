// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { LockBusyError, withLock, type LockStore } from '@/lib/lock'

function memoryStore(): LockStore & { holders: Map<string, string> } {
  const holders = new Map<string, string>()
  return {
    holders,
    acquire: async (name, holder) => { if (holders.has(name)) return false; holders.set(name, holder); return true },
    release: async (name, holder) => { if (holders.get(name) === holder) holders.delete(name) },
  }
}

test('jobs that rewrite the archives take turns', async () => {
  const store = memoryStore()
  const order: string[] = []
  let releaseFirst!: () => void
  const first = withLock(store, 'drive', () => new Promise<void>((r) => { order.push('first'); releaseFirst = r }))
  await Promise.resolve()
  // The second waits (no real sleeping in the test) and gives up after its attempts.
  const sleeps: number[] = []
  await expect(withLock(store, 'drive', async () => { order.push('second') },
    { attempts: 3, waitMs: 10, sleep: async (ms) => { sleeps.push(ms) } })).rejects.toBeInstanceOf(LockBusyError)
  expect(sleeps).toEqual([10, 10])
  releaseFirst()
  await first
  await withLock(store, 'drive', async () => { order.push('third') })
  expect(order).toEqual(['first', 'third'])
  expect(store.holders.size).toBe(0)
})

test('the lock is released when the job throws', async () => {
  const store = memoryStore()
  await expect(withLock(store, 'drive', async () => { throw new Error('boom') })).rejects.toThrow('boom')
  expect(store.holders.size).toBe(0)
})
