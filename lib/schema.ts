// SPDX-License-Identifier: GPL-3.0-or-later
import { SCHEMA_STATEMENTS, SCHEMA_VERSION } from '@/db/schema.mjs'
import type { Sql } from './db'

// Arbitrary constant naming the migration advisory lock, so two cold starts
// that both find an old schema apply it one after the other, not interleaved.
const MIGRATION_LOCK = 724_031

type Migrator = {
  readVersion: () => Promise<number | null>
  apply: () => Promise<void>
}

/**
 * Bring the database up to SCHEMA_VERSION if it is behind. Every statement is
 * idempotent, so a concurrent or repeated run is harmless; the advisory lock
 * just keeps two runs from racing on the same CREATE INDEX.
 */
export async function migrateIfNeeded(m: Migrator): Promise<boolean> {
  let current: number | null = null
  try { current = await m.readVersion() } catch { current = null } // schema_meta missing → fresh/old DB
  if (current !== null && current >= SCHEMA_VERSION) return false
  await m.apply()
  return true
}

function neonMigrator(sql: Sql): Migrator {
  return {
    readVersion: async () => {
      const rows = await sql`SELECT version FROM schema_meta WHERE id = 1` as { version: number }[]
      return rows[0] ? Number(rows[0].version) : null
    },
    apply: async () => {
      await sql.transaction((txn) => [
        txn`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK})`,
        ...SCHEMA_STATEMENTS.map((s) => txn.query(s)),
        txn`INSERT INTO schema_meta (id, version) VALUES (1, ${SCHEMA_VERSION})
            ON CONFLICT (id) DO UPDATE SET version = GREATEST(schema_meta.version, EXCLUDED.version)`,
      ])
    },
  }
}

let ready: Promise<unknown> | null = null

/** Run the migration at most once per server instance (retried after a failure). */
export function ensureSchema(sql: Sql): Promise<unknown> {
  if (!ready) ready = migrateIfNeeded(neonMigrator(sql)).catch((e) => { ready = null; throw e })
  return ready
}
