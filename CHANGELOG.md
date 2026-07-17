# Changelog

All notable changes to **rosu-web** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(`MAJOR.MINOR.PATCH`). The first public release will be **v1.0.0**, shipped once the
site is deployed and verified end-to-end; fixes and features land as `1.0.1`,
`1.1.0`, and so on from there.

## [Unreleased]

### Added
- **Landing page** (`/`) — Rosu brand (own rose/gem mark, light/dark aware), feature
  highlights, and a Download button to the desktop app's GitHub Releases.
- **Report / contact form** (`/report`) — title, description, optional screenshot and
  contact e-mail, protected by Cloudflare Turnstile and a honeypot; a plain-text
  disclosure of exactly what is sent.
- **`POST /api/report`** — a single endpoint accepting both the Rosu desktop app
  (honeypot + shared token) and the web form (Turnstile); validates input, rate-limits
  per hashed IP, stores the report, and uploads any screenshot to Google Drive.
- **Neon Postgres data layer** — report rows + a rate-limit ledger, with a migration.
- **Google Drive integration** — screenshots and periodic ZIP archives stored in the
  owner's Drive via the desktop app's OAuth client (`drive.file` scope); a one-time
  refresh-token minter (`scripts/mint-drive-token.mjs`).
- **Periodic archiving** — a daily Vercel Cron job (plus a manual "Archive now") bundles
  pending reports + images into a ZIP in Drive and empties the staging area.
- **Protected `/admin` viewer** — password login (rate-limited, constant-time compare,
  signed httpOnly session cookie), a submissions table with thumbnails streamed through
  an auth-gated Drive proxy, and the manual archive trigger.
- **Spam / abuse controls** — honeypot, Turnstile (web), shared token (desktop),
  per-IP + global rate limits, request-size and MIME/magic-byte validation, and
  server-generated filenames. Raw IPs are never stored (salted hash only).
- Test suite (Vitest), GPL-3.0-or-later license, and project documentation.

[Unreleased]: https://github.com/Kerevizodunu2000/rosu-web/commits/main
