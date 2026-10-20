// SPDX-License-Identifier: GPL-3.0-or-later
// Named job locks over the database (v1.6): a lease that runs out on its own,
// so a function killed mid-job never wedges the next one. The nightly archive,
// the retention sweep and deletion requests all rewrite the Drive archives;
// taking turns is what keeps a deleted report from surviving in a copy that
// another job built at the same moment.
import { randomUUID } from 'node:crypto'

export const DRIVE_ARCHIVES_LOCK = 'drive-archives'

export type LockStore = {
  acquire: (name: string, holder: string, ttlSeconds: number) => Promise<boolean>
  release: (name: string, holder: string) => Promise<void>
}

export class LockBusyError extends Error {
  constructor(name: string) { super(`lock busy: ${name}`) }
}

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Run ``fn`` holding ``name``; tries ``attempts`` times ``waitMs`` apart, then
 *  throws :class:`LockBusyError`. The lease (``ttlSeconds``) must outlast the
 *  longest the function may run. */
export async function withLock<T>(store: LockStore, name: string, fn: () => Promise<T>,
  opts: { ttlSeconds?: number; attempts?: number; waitMs?: number; sleep?: (ms: number) => Promise<void> } = {}): Promise<T> {
  const { ttlSeconds = 300, attempts = 1, waitMs = 2000, sleep = pause } = opts
  const holder = randomUUID()
  for (let i = 0; i < attempts; i++) {
    if (await store.acquire(name, holder, ttlSeconds)) {
      try {
        return await fn()
      } finally {
        try { await store.release(name, holder) } catch { /* it runs out on its own */ }
      }
    }
    if (i + 1 < attempts) await sleep(waitMs)
  }
  throw new LockBusyError(name)
}
