// SPDX-License-Identifier: GPL-3.0-or-later
import { getDb } from './db'

export type DbHealth = 'ok' | 'down'

/** Can the database answer a trivial query within a few seconds? Never throws. */
export async function dbHealth(probe?: () => Promise<unknown>, timeoutMs = 4000): Promise<DbHealth> {
  const run = probe ?? (async () => { const sql = await getDb(); await sql`SELECT 1` })
  try {
    await Promise.race([
      run(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ])
    return 'ok'
  } catch {
    return 'down'
  }
}
