// SPDX-License-Identifier: GPL-3.0-or-later
//
// The database schema, as an ordered list of idempotent DDL statements. It is
// the single source of truth for both `npm run migrate` (db/migrate.mjs) and the
// app's own on-demand migration (lib/schema.ts), so a deploy that ships new
// columns can never run against a database that lacks them. Every statement
// must stay safe to re-run: CREATE ... IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
// Bump SCHEMA_VERSION whenever a statement is added.

export const SCHEMA_VERSION = 2

export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS schema_meta (
    id      int PRIMARY KEY CHECK (id = 1),
    version int NOT NULL
  )`,

  // ── reports (v1.0) ──────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS reports (
    id            bigserial PRIMARY KEY,
    created_at    timestamptz NOT NULL DEFAULT now(),
    source        text NOT NULL,
    title         text NOT NULL,
    description   text NOT NULL,
    contact       text,
    app_version   text,
    os            text,
    lang          text,
    ip_hash       text,
    image_status  text NOT NULL DEFAULT 'none',
    image_drive_id text,
    image_name    text,
    image_mime    text,
    image_original_name text,
    archive_ref   text,
    archived_at   timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS reports_unarchived_idx ON reports (created_at DESC) WHERE archived_at IS NULL`,
  // v1.1: original uploaded filename (the CREATE TABLE above is a no-op once the table exists).
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS image_original_name text`,
  // v1.3: status tracking. Only a SHA-256 of the reporter's tracking token is
  // stored, so a database leak does not hand out working status links.
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'received'`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS status_note text`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS fixed_in text`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS status_updated_at timestamptz`,
  `ALTER TABLE reports ADD COLUMN IF NOT EXISTS status_token_hash text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS reports_status_token_idx ON reports (status_token_hash) WHERE status_token_hash IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS reports_created_idx ON reports (created_at)`,

  // ── rate_events (v1.0; `kind` v1.3) ─────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS rate_events (
    ip_hash    text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Each limiter (report / login / crash) counts only its own events, so one
  // cannot exhaust another's global budget (e.g. login spam blocking reports).
  `ALTER TABLE rate_events ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'report'`,
  `CREATE INDEX IF NOT EXISTS rate_events_lookup_idx ON rate_events (ip_hash, created_at)`,
  // Serves the global (all-IP) rate count and the periodic prune, both of which
  // filter on created_at alone.
  `CREATE INDEX IF NOT EXISTS rate_events_created_idx ON rate_events (created_at)`,
  `CREATE INDEX IF NOT EXISTS rate_events_kind_idx ON rate_events (kind, ip_hash, created_at)`,

  // ── admin (v1.3) ────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS admin_sessions (
    id          text PRIMARY KEY,
    auth_time   timestamptz NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz NOT NULL,
    revoked_at  timestamptz,
    ip_hash     text
  )`,
  `CREATE TABLE IF NOT EXISTS admin_audit (
    id      bigserial PRIMARY KEY,
    at      timestamptz NOT NULL DEFAULT now(),
    event   text NOT NULL,
    ip_hash text,
    detail  text
  )`,
  `CREATE INDEX IF NOT EXISTS admin_audit_at_idx ON admin_audit (at DESC)`,
  `CREATE INDEX IF NOT EXISTS admin_audit_fail_idx ON admin_audit (ip_hash, at) WHERE event = 'login_fail'`,
  // One row per accepted TOTP time-step: a code is good for exactly one login.
  `CREATE TABLE IF NOT EXISTS admin_totp_used (
    step    bigint PRIMARY KEY,
    used_at timestamptz NOT NULL DEFAULT now()
  )`,

  // ── crash fingerprints (v1.3) ───────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS crash_groups (
    fingerprint  text PRIMARY KEY,
    exc_type     text NOT NULL,
    message      text,
    frames       text NOT NULL,
    first_seen   timestamptz NOT NULL DEFAULT now(),
    last_seen    timestamptz NOT NULL DEFAULT now(),
    hits         int NOT NULL DEFAULT 0,
    last_version text
  )`,
  `CREATE TABLE IF NOT EXISTS crash_events (
    id          bigserial PRIMARY KEY,
    fingerprint text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    app_version text,
    os          text,
    ip_hash     text
  )`,
  `CREATE INDEX IF NOT EXISTS crash_events_fp_idx ON crash_events (fingerprint, created_at)`,
  `CREATE INDEX IF NOT EXISTS crash_events_created_idx ON crash_events (created_at)`,
]
