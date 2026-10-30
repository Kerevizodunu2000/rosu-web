# Changelog

All notable changes to **rosu-web** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(`MAJOR.MINOR.PATCH`). The first public release will be **v1.0.0**, shipped once the
site is deployed and verified end-to-end; fixes and features land as `1.0.1`,
`1.1.0`, and so on from there.

## [Unreleased]

Work toward **2.0 "Brand & Show"**.

### Added
- **Türkçe and 日本語.** Every public page is also at `/tr/…` and `/ja/…` (English stays at
  the bare paths), built ahead of time. A language switcher in the header keeps you on the
  same page. Every page names its language versions (`hreflang`), and the sitemap lists
  all of them. The guide is translated; release notes, devlog posts and the API reference
  stay in English and say so. The privacy policy and terms keep their binding English and
  Turkish texts, and the Japanese pages add a short summary.
- Report tracking links (on the page and in the confirmation e-mail) open the status page
  in the reporter's language.
- **Rosu Wrapped** (`/tools/wrapped`): your year in beatmaps from a Rosu JSON export — sets
  added, the busiest month, top artists, favourite mode, hours of music, the hardest map —
  with a 1080×1350 PNG to share. Runs in the browser; nothing is uploaded.
- A 404 page in all three languages.

### Changed
- The home page loads the screenshot viewer only when you open it, and the site targets current
  browsers (Chrome and Edge 111, Firefox 111, Safari 16.4) instead of shipping legacy code.
- The guide covers v1.9–v1.10 (watch folder, saved searches, gallery, Move Library, same-song
  detection). The home page no longer says Rosu "doesn't phone home": crash reports are opt-in
  and the update check only asks for the latest version number.
- The site sends HSTS (two years, subdomains, no preload) and `Cross-Origin-Opener-Policy:
  same-origin`; API responses also send `Cross-Origin-Resource-Policy: same-origin` (CORP).

## [1.6.0] - 2026-10-20

**Tools: free helpers that run in your browser.**

### Added
- **/tools** with two in-browser helpers; nothing is uploaded:
  - **Missing pack checker** — drop your beatmap pack files (or paste their names) and see
    which numbered osu!, mania, taiko and catch packs (S / SM / ST / SC) you are missing
    between your lowest and highest, with links to each pack page and a copyable list.
    The rules are the desktop app's gap detection; other series are listed, never guessed.
  - **Library share card** — load a Rosu JSON export (Search → Export… → JSON) and download
    a 1200×630 PNG with your set count, hours of music, hardest star rating, mania key
    counts, modes and top artists.
- "Tools" in the site navigation and the sitemap; both pages are in the e2e and
  accessibility checks.

### Fixed
Found by the v1.6 code and security review (before release):
- **Two deletion requests at once could leave one report in a rebuilt archive.** Every job
  that rewrites the Drive archives — the nightly archive, the retention sweep and "Delete
  everywhere" — now takes turns through a lease in the database (`job_locks`, schema 4;
  a lease a killed function never gives back simply runs out). A deletion that cannot get
  its turn within a few seconds says the archive is busy and changes nothing.
- A deletion also checks every archive dated between the report's creation and the archive
  it names, so a copy left by a run that died before marking its reports is found too.
- When the archive job cannot take reports deleted mid-run back out of its new ZIP (after
  three tries), the activity log names the file to fix by hand.
- Missing pack checker: a date or timestamp in a file name (`S20240101 - …`) no longer
  counts as a pack (it froze the tab building a 20-million-entry gap list); downloads still
  in progress (`.crdownload`, `.part`) do not count as owned; very long pasted lines are
  cut; a list past 20,000 names says so; the result summary is announced to screen readers;
  "Choose files…" shows a keyboard focus ring.
- Share card: names and artists can no longer run off the card or into another column; only
  real set records are counted, and a library past 200,000 sets says so; an older, slower
  file load can no longer replace a newer one; the card's content is also available as text.
- Admin: the delete button's accessible name starts with its visible text; an expired
  session or a busy server get their own message.

Found by the v1.5 code and security review:
- **Delete everywhere** now also deletes a screenshot whose status says "archived" while its
  Drive file id is still set.
- **A rewritten archive escaped the 12-month retention**: the retention sweep read the
  Drive creation time, which a rewrite resets. It now goes by the date in the archive's
  name (an archive dated D only holds reports created by the end of D). Archives are
  never updated in place, because Drive would keep the old content as a revision.
- **Delete everywhere vs. the nightly archive**: the row is deleted only while its archive
  reference is still the one that was cleaned (otherwise the new archive is cleaned
  first), and the archive job takes a report that was deleted while its ZIP was being
  built back out of that ZIP. An archive upload whose reports could not be marked is
  deleted again, so a report is never in two archives.
- Bulk status kept no public note or "fixed in" version: each report now keeps its own
  unless a new one is given.
- A report's status cell could show stale values after a save or a bulk change.
- The delete route requires a JSON body whose `confirm` is exactly the id (a number or a
  string of digits); failed deletions are written to the activity log too, and a failing
  audit write no longer turns a finished deletion into an error. Drive settings are only
  needed when a report has something in Drive.
- An unreadable archive stops the deletion with a clear message instead of a generic
  Drive error; an archive that is already gone is skipped.
- Admin list: control characters are removed from the search; a page past the end shows
  the last page; the status menu's counts follow the other filters.
- Admin panel: clearer error messages, a label on every delete button, link colors with
  enough contrast for small text, UTC in chart titles, a message when a chart has
  nothing to show, a visible chart baseline, and one status-count query fewer.

### Changed
- `/privacy` describes a deletion precisely (database row, screenshot, archive entry;
  Drive deletions are permanent) instead of promising "every copy".

## [1.5.0] - 2026-10-20

**Admin Panel Pro.**

### Added
- **Search, filters and pages** in the admin list: text search over title, description,
  contact e-mail or `#id`; status (with counts) and source filters; 50 reports per page
  with newer/older links. The URL holds the state, so a filtered view survives a reload.
  The old 100-row cap is gone.
- **Bulk status**: tick reports (or the whole page) and set one status — with "fixed in"
  — for up to 100 at once. `POST /api/admin/status` accepts `ids` alongside `id`.
- **Delete everywhere** (data-subject requests): one action removes a report's database
  row, its screenshot in Drive and its entry in the Drive archive it went into (the
  archive is rewritten without it, or deleted when it was the last report). Drive goes
  first, so a failure keeps the row for a retry; "already gone" is not an error; the
  admin types the report id to confirm; the audit log records the id only.
  `POST /api/admin/delete`.
- **Statistics**: reports total / open / fixed and crash reports in the last 14 days;
  reports per week (12 weeks) and crash reports per day (14 days) as column charts with
  a table view; reports by app version.

### Changed
- `/privacy` says that a deletion covers every copy (report, screenshot, archive entry).

## [1.4.0] - 2026-10-20

Quality & visibility release.

### Added
- **`/changelog`** — every desktop release from GitHub Releases (notes, download, release
  page), rebuilt at most hourly.
- **`/docs`** (user guide) and **`/docs/api`** (the public contract of `/api/report`,
  `/api/crash`, `/api/latest-version` and `/api/health`).
- **`/devlog`** with a first post, *A zero-budget bug-report pipeline*. Posts are plain
  Markdown in `content/devlog/posts.ts`, rendered by a small built-in Markdown subset
  that never passes HTML through and only allows http(s)/relative links.
- **`/status`** page and **`GET /api/health`** (`{ ok, db }`, 503 when the database is
  down) for uptime monitors.
- **SEO**: `sitemap.xml`, `robots.txt` (keeps `/admin`, `/api/` and status links out of
  search), schema.org `SoftwareApplication` JSON-LD, and a generated **social card**
  (`opengraph-image` / `twitter-image`) instead of a cropped screenshot.
- **CI** (GitHub Actions): lint, unit tests, production build and a production-dependency
  audit gate on every push/PR, plus a **Playwright** job running end-to-end smoke tests
  and **axe** accessibility checks (WCAG 2 A/AA, serious+critical) on every public page,
  the report form's failure path and the secret admin path.
- **Dependabot** for npm (grouped minor/patch, weekly) and GitHub Actions (monthly).

### Changed
- Accent-coloured text uses a deeper pink in light mode (5.7:1 on white, was ~3.4:1);
  backgrounds and gradients keep the bright brand pink.
- The navigation has one list of links (Features, Changelog, Docs, Report a problem)
  rendered for both layouts; the footer links the devlog and status pages.
- The footer year is read in the browser, so it no longer freezes at the build year.
- Licence wording is "GPL-3.0-or-later" everywhere.

### Fixed
- Code blocks are keyboard-scrollable, and the screenshot-carousel dots are a plain
  button group instead of an incomplete tab list (both flagged by axe).
- The footer logo is no longer preloaded as if it were above the fold.
- Lint is clean (the lightbox no longer writes a ref during render).

### Removed
- Unused `public/rosu-mark-outline.svg`, `public/rosu-splash.png` and the unused
  gradients/symbol inside `rosu-mark.svg`.

### Security
- **Next.js 16.2.10 → 16.4.2**, which fixes a set of critical advisories in the version
  in production (including a Proxy bypass, RCE in the Image Optimization API and in
  `next/og`, cache poisoning and SSRF). Vulnerable transitive `nanoid`, `source-map-js`
  and `baseline-browser-mapping` are pinned to fixed versions via `overrides`.

## [1.3.0] - 2026-10-20

Security & platform release.

### Added
- **Report status tracking** — every report now gets a private, unguessable tracking
  link (`/report/status/<token>`, no account needed) showing *received → in review →
  fixed in vX* plus an optional public note. Only a SHA-256 of the token is stored.
  `POST /api/report` returns it as `status_url` (backward compatible for the desktop
  app); the web form shows it with a copy button. The admin panel gains a per-report
  status editor.
- **Opt-in confirmation e-mail** (Resend) with the tracking link. Off unless
  `RESEND_API_KEY` and `ACK_EMAIL_FROM` are both set; never echoes anything the
  reporter typed; its own tight budget (one per recipient a day, 3/day per sender,
  50/day overall).
- **`GET /api/latest-version`** — the latest desktop release (version, release page,
  `.exe` + `.sha256` download URLs, release-notes excerpt) from GitHub Releases,
  CDN-cached and memoised per instance (a cache-busting query string cannot drive
  GitHub calls), for the app's update check.
- **`POST /api/crash`** — opt-in crash fingerprints from the desktop app. Token and
  rate limit are checked before any parsing; the server clips and scrubs paths and
  e-mail addresses, computes the fingerprint itself, keeps at most 500 distinct
  crashes, and the admin panel groups identical crashes with a distinct-users count
  (from a crash-only salted IP hash, disclosed in the policy).
- **Admin two-factor sign-in** (TOTP, RFC 6238) via `ADMIN_TOTP_SECRET`; each code is
  accepted once. `scripts/totp-setup.mjs` generates the secret.
- **Secret admin path** (`ADMIN_PATH`): the panel moves to `/<slug>` and `/admin` +
  `/api/admin/*` answer 404. Admin routes also require the proxy's gate header, so a
  path the proxy does not see cannot reveal them; dot segments and double encoding
  under the slug are refused; a malformed `ADMIN_PATH` disables the panel instead of
  falling back to `/admin`.
- **Progressive login lockout** (30 s, doubling, max 15 min per address) on top of the
  per-IP rate limit. Failed attempts are counted in short-lived rate events; at most
  60 failed sign-ins an hour are written to the audit log, so a flood cannot bury
  real events.
- **Admin audit log** (Neon) of sign-ins, lockouts, logouts, archive runs, status
  changes and retention sweeps, shown in the panel with a security summary.
- **Cron watchdog** — the nightly job pings `HEALTHCHECKS_PING_URL` on success and
  `/fail` on error.

### Changed
- **12-month retention is now enforced**: the nightly job deletes archive ZIPs, archived
  report rows, crash data and audit entries older than twelve months, as `/privacy`
  promises. Each purge runs independently (a Drive outage no longer skips the
  database purges), the two-day rate-event prune runs even when archiving fails, and
  any failed step pings the watchdog's `/fail`. The policy (EN + TR) now also covers tracking links, confirmation e-mails
  (Resend) and opt-in crash reports.
- **Admin sessions are server-side**: the cookie (`__Host-`, `SameSite=Strict`) carries
  a random session id stored in Neon — logout and "sign out everywhere" revoke it;
  idle timeout 2 h, absolute 12 h, rotated every 15 minutes of use. An id is rotated
  at most once (atomic claim), so a replayed or concurrent old cookie cannot fork the
  session, and logout ends every session descended from that sign-in. A database
  failure during "sign out everywhere" is reported instead of answered with "ok".
  Existing sessions are signed out once by this upgrade.
- Rate limits and lockouts key on the IPv6 /64 (IPv4: the address), so rotating
  addresses inside one allocation no longer resets them.
- Secrets are compared in constant time including their length.
- Admin API calls check the request `Origin` (defence in depth against CSRF).
- Rate-limit events carry a `kind`, so login, report, crash and e-mail budgets no
  longer share one global counter (login spam could previously exhaust the global
  report budget).
- The schema lives in `db/schema.mjs` and the app applies it itself on first use
  (idempotent, advisory-locked), so a deploy cannot run against missing columns;
  `npm run migrate` uses the same statements.
- The admin image proxy sends a sandboxing `Content-Security-Policy`.
- The "A look inside" screenshots section now states which desktop release the
  screenshots were captured from (Rosu v1.3.3), with a version chip next to the
  heading.

## [1.2.1] - 2026-07-18

### Added
- Community health files: code of conduct (Contributor Covenant 2.1), contributing
  guide, security policy, issue templates (bug/feature + contact links), and a pull
  request template. GitHub community-standards checklist now passes at 100%.
- GitHub private vulnerability reporting enabled, so `SECURITY.md`'s advisory link
  works.

## [1.2.0] - 2026-07-18

### Added
- **Screenshot carousel** — the "A look inside" section now rotates through six
  screenshots (Packs, Search, Artists, Shortcuts, Logs, Settings) across three cards
  with a staggered slide animation, dot navigation, pause on hover/focus, and
  reduced-motion support.
- **Drag gestures in the lightbox** — grab the enlarged image and drag horizontally to
  flick to the previous/next screenshot; drag far enough in any direction to dismiss
  (with a follow-the-pointer fade). Wheel-zoom and drag-pan while zoomed unchanged.
- **Threshold auto-archive** — when `AUTO_ARCHIVE_THRESHOLD` (default 25) unarchived
  reports pile up, the backend bundles them to Drive right after responding, instead of
  waiting for the nightly cron (which remains the backstop).
- **Consent line on the report form** — "By sending, you agree to our Privacy Policy and
  Terms." at the point of collection (transparency line, deliberately not a consent
  checkbox — processing rests on legitimate interest).

### Fixed
- GitHub contributor cache refreshed after the history rewrite, removing a stale
  co-author from the repository sidebar.

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

[Unreleased]: https://github.com/Kerevizodunu2000/rosu-web/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/Kerevizodunu2000/rosu-web/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Kerevizodunu2000/rosu-web/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/Kerevizodunu2000/rosu-web/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Kerevizodunu2000/rosu-web/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Kerevizodunu2000/rosu-web/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Kerevizodunu2000/rosu-web/releases/tag/v1.0.0
