// SPDX-License-Identifier: GPL-3.0-or-later
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'
const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL is required'); process.exit(1) }
const sql = neon(url)
const ddl = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
for (const stmt of ddl.split(';').map((s) => s.trim()).filter(Boolean)) await sql.query(stmt)
console.log('migrated')
