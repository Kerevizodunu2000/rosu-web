// SPDX-License-Identifier: GPL-3.0-or-later
// Manual migration (`npm run migrate`). The app also migrates itself on first
// use (lib/schema.ts), so this is only needed to prepare a database by hand.
import { neon } from '@neondatabase/serverless'
import { SCHEMA_STATEMENTS, SCHEMA_VERSION } from './schema.mjs'
const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL is required'); process.exit(1) }
const sql = neon(url)
for (const stmt of SCHEMA_STATEMENTS) await sql.query(stmt)
await sql.query(
  `INSERT INTO schema_meta (id, version) VALUES (1, $1)
   ON CONFLICT (id) DO UPDATE SET version = GREATEST(schema_meta.version, EXCLUDED.version)`,
  [SCHEMA_VERSION],
)
console.log(`migrated (schema v${SCHEMA_VERSION})`)
