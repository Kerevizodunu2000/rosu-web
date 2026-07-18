# Changelog

All notable changes to **rosu-web** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(`MAJOR.MINOR.PATCH`). The first public release will be **v1.0.0**, shipped once the
site is deployed and verified end-to-end; fixes and features land as `1.0.1`,
`1.1.0`, and so on from there.

## [Unreleased]

## [1.1.0] - 2026-07-18

Compliance, accessibility, and hardening pass following independent code, design,
security, and legal reviews.

### Added
- **Privacy Policy** (`/privacy`) — bilingual (EN + TR) GDPR/KVKK information notice
  (controller, lawful basis, international transfer, retention, data-subject rights +
  the right to complain to a supervisory authority), linked from the footer and the
  report form.
- **Terms** (`/terms`) — short bilingual "as-is / no warranty / GPL / unofficial" notice
  with an abuse / IP contact.
- **Click-to-zoom lightbox** for the landing screenshots (hero + Packs/Search/Settings):
  the three screenshots page left/right (arrow buttons + keyboard arrows), the enlarged
  image zooms with the mouse wheel and pans by dragging, with animated open + slide
  transitions. Accessible (Escape/backdrop close, focus trap, scroll lock) and shared with
  the `/admin` image viewer.
- **Social links** in the footer (Instagram, X, YouTube, Reddit) and a prominent live-site
  link in the README.
- Footer contact e-mail now **copies to the clipboard** on click (in addition to opening a
  mail client).
- The **original uploaded image filename** is stored (`image_original_name`) and shown in
  the admin table, alongside the server-side `rosu-<id>` name.
- **Social share metadata** (Open Graph + Twitter card), a favicon, and a "Skip to content"
  link for keyboard users.

### Changed
- Report form: focus now moves to the confirmation/error after submitting; the Turnstile
  widget has a label, reserved height (no layout shift), and a hint on the disabled
  submit; added a "Send another report" action and `aria-busy` while sending.
- Light-mode gradient headline uses the darker brand stops so it clears the large-text
  contrast minimum.
- Extracted the archive job into `lib/archiveJob.ts`, shared by the cron and admin
  routes (route modules no longer cross-import or export non-handlers).

### Fixed
- The screenshot lightbox no longer freezes the page when opened from the hero — it renders
  through a portal, so the hero card's `transform` animation can't trap the fixed overlay
  inside it (which had left the page scroll-locked).
- The nightly archive no longer wedges when a single screenshot can't be downloaded from
  Drive — it archives the report text and continues.
- Image size cap aligned with the request-body budget, so an at-cap screenshot degrades
  gracefully (text saved, image flagged) instead of `413`-ing the whole report.
- `rate_events` is pruned on each archive run and gained a `created_at` index, preventing
  unbounded growth and slow global rate counts.

### Security
- Neutralized CSV formula / DDE injection in the archived `reports.csv`.
- Added baseline security headers: `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`.
- Desktop app-token comparison is now constant-time.
- Required secrets (Drive credentials, IP-hash salt, Turnstile secret) fail loudly if
  unset instead of silently degrading (e.g. an `"undefined"` hash salt).
- Tightened WEBP validation to require the `WEBP` FourCC, not just a `RIFF` container.

## [1.0.0] - 2026-07-18

First public release. Live at <https://rosu-web.vercel.app>.

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

[Unreleased]: https://github.com/Kerevizodunu2000/rosu-web/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Kerevizodunu2000/rosu-web/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Kerevizodunu2000/rosu-web/releases/tag/v1.0.0
