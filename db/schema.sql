-- SPDX-License-Identifier: GPL-3.0-or-later
CREATE TABLE IF NOT EXISTS reports (
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
  archive_ref   text,
  archived_at   timestamptz
);
CREATE INDEX IF NOT EXISTS reports_unarchived_idx ON reports (created_at DESC) WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS rate_events (
  ip_hash    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_events_lookup_idx ON rate_events (ip_hash, created_at);
-- Serves the global (all-IP) rate count and the periodic prune, both of which
-- filter on created_at alone.
CREATE INDEX IF NOT EXISTS rate_events_created_idx ON rate_events (created_at);
