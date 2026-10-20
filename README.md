<div align="center">

<img src="public/rosu-mark.svg" alt="Rosu" width="96" height="96" />

# rosu-web

**The website & bug-report backend for [Rosu](https://github.com/Kerevizodunu2000/rosu)** — a free, open-source osu! beatmap-pack archive manager for Windows.

[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-ff2e97.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![Deployed on Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com)

### 🌐 Live at **[rosu-web.vercel.app](https://rosu-web.vercel.app)**

[Open the site](https://rosu-web.vercel.app) · [Report a problem](https://rosu-web.vercel.app/report) · [Privacy](https://rosu-web.vercel.app/privacy)

</div>

---

## What it is

rosu-web does two jobs:

1. **A landing page** for Rosu — what it is, what it does, and a Download button.
2. **A bug-report / contact system** — a web form **and** an API endpoint (`POST /api/report`) that the Rosu **desktop app** posts to directly. Submissions are stored, screenshots are archived, and the owner reads them through a protected `/admin` page.

Everything runs on **free, no-credit-card, never-sleeping** infrastructure.

## How it works

```
                    ┌──────────────┐         ┌──────────────────────────┐
  Rosu desktop app ─┤              │         │ Neon Postgres            │
  (honeypot+token)  │              │  text   │  report rows + rate limit│
                    │ POST         ├────────▶│  (a tiny free query index│
  Web report form  ─┤ /api/report  │         │   — NOT bulk storage)    │
  (Turnstile)       │              │         └──────────────────────────┘
                    │              │  image  ┌──────────────────────────┐
                    └──────┬───────┘────────▶│ Google Drive (owner's,   │
                           │                 │  15 GB): screenshots +   │
             daily cron ───┘  zip + purge    │  periodic ZIP archives   │
             / "Archive now"                 └──────────────────────────┘
```

- **Report text** → **Neon** (serverless Postgres). Used for rate-limiting, atomic ids, admin listing, and staged/archived status — *not* as bulk storage.
- **Screenshots** → the owner's **Google Drive** (private, 15 GB), reusing the desktop app's existing OAuth client (scope `drive.file`).
- A **daily Vercel Cron** (plus a manual "Archive now" button) bundles pending reports + images into a ZIP in Drive and empties the staging area — so no small-quota store ever fills. The same nightly job **enforces the 12-month retention** (old archive ZIPs, archived report rows, crash data and the admin log are deleted) and pings an optional **healthchecks.io** watchdog.
- Every report gets a private **tracking link** (`/report/status/<token>`; only the token's hash is stored) showing received → in review → fixed in vX. Reporters can opt in to a one-off confirmation e-mail with that link (Resend).
- The app migrates its own database schema on first use (idempotent DDL in `db/schema.mjs`), so a deploy can never run against missing columns.
- The public endpoint is defended by a **honeypot**, **Cloudflare Turnstile** (web form), a **shared token** (desktop app), and **per-IP + global rate limits**. IPs are only ever stored as a salted hash.

## Tech stack

| Layer | Choice |
|---|---|
| Framework / host | **Next.js 16** (App Router, TypeScript) on **Vercel** (Hobby) |
| Database | **Neon** — serverless Postgres, no card, auto-resume |
| Image / archive storage | **Google Drive** (`drive.file` scope, OAuth refresh token) |
| Web-form captcha | **Cloudflare Turnstile** |
| Admin session | signed cookie (`jose`) carrying a server-side session id (Neon) — revocable, rotated, TOTP 2FA |
| Archives | in-memory ZIP (`jszip`) |
| Tests | **Vitest** |

## Pages & API

| Route | What |
|---|---|
| `/` | Landing page (screenshots open in an accessible lightbox) |
| `/report` | Report / contact form (Turnstile-protected) |
| `/privacy` | Privacy Policy — bilingual (EN + TR) |
| `/terms` | Terms — bilingual (EN + TR) |
| `/report/status/<token>` | A reporter's private status page (no account) |
| `/admin` | Submissions, status updates, crash groups, activity log (password + optional TOTP; can live under a secret `ADMIN_PATH`) |
| `POST /api/report` | Accepts the desktop app **and** the web form; returns `{ ok, id, status_url }` |
| `POST /api/crash` | Opt-in crash fingerprints from the desktop app (token + rate limit, scrubbed server-side) |
| `GET /api/latest-version` | Latest desktop release (version, download + SHA-256 URLs, notes) for the in-app update check; CDN-cached |
| `GET /api/cron/archive` | Nightly job: archive → 12-month retention → watchdog ping (Vercel Cron) |
| `POST /api/admin/{login,logout,archive,status}` | Admin session, manual archive, report status |
| `GET /api/admin/image/[id]` | Auth-gated Drive image proxy (never a public URL) |

## Local development

```bash
npm install
cp .env.example .env.local      # then fill in the values (see below)
npm run migrate                 # optional: create/upgrade the Neon tables up front (the app also does it on first use)
npm run dev                     # http://localhost:3000
npm run test                    # Vitest
```

### Environment variables

Set these in Vercel (Project → Settings → Environment Variables) and, for local dev, in `.env.local` (git-ignored). Names only — see [`.env.example`](./.env.example).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` | Reused from the Rosu desktop OAuth client |
| `GOOGLE_REFRESH_TOKEN` | Minted once via `scripts/mint-drive-token.mjs` (sign in as the Rosu account) |
| `GOOGLE_DRIVE_ROOT_FOLDER` | Drive folder name (default `Rosu Reports`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile |
| `REPORT_APP_TOKEN` | Shared friction token for the desktop path |
| `ADMIN_PASSWORD` | `/admin` login |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie |
| `IP_HASH_SALT` | Salts hashed IPs |
| `CRON_SECRET` | Protects the archive cron route |
| `AUTO_ARCHIVE_THRESHOLD` | Archive right away once this many reports are pending (default 25, `0` = off) |
| `ADMIN_PATH` | *Optional.* Secret admin path (12–64 chars `A-Z a-z 0-9 _ -`); `/admin` then answers 404 |
| `ADMIN_TOTP_SECRET` | *Optional.* Requires an authenticator code at sign-in — generate with `node scripts/totp-setup.mjs` |
| `RESEND_API_KEY` / `ACK_EMAIL_FROM` | *Optional.* Enable the opt-in confirmation e-mail (both required) |
| `HEALTHCHECKS_PING_URL` | *Optional.* healthchecks.io ping for the nightly job (`/fail` on error) |
| `GITHUB_TOKEN` | *Optional.* Higher GitHub API limit for `/api/latest-version` |

### Admin security

- Sign-in = password (constant-time) + optional TOTP code (each code works once). Failed attempts from one address trigger a progressive lockout (30 s, doubling, max 15 min) on top of the per-IP rate limit. Every sign-in and admin action lands in an audit log shown in the panel.
- Sessions live server-side: a `__Host-` cookie (`HttpOnly`, `Secure`, `SameSite=Strict`) carries only a random session id. Idle timeout 2 h, absolute 12 h, a fresh id every 15 min of use (each id rotates once); logout ends the whole sign-in and "sign out everywhere" revokes every session on the server.
- With `ADMIN_PATH` set, admin routes answer only through the proxy (which stamps a gate header); a malformed value disables the panel rather than exposing `/admin`.
- Limits and lockouts key on the IPv6 /64 (IPv4: the address).

## Privacy

A submission contains only what the user types (title, description, optional contact e-mail), light diagnostics (app version, OS, UI language) and an optional screenshot the user attaches. No hidden telemetry. Raw IPs are never stored — only a salted hash, used solely for rate-limiting. What's sent is disclosed on the form, and the full bilingual (EN + TR) policy is published at [`/privacy`](https://rosu-web.vercel.app/privacy).

## Project structure

```
app/            App Router — (site) group (landing + report), admin, api routes
lib/            db, drive, validation, ratelimit, turnstile, session, zip, report/archive services
components/     Nav, Footer, Brand, ReportForm, Disclosure, AdminTable, AdminPanels
proxy.ts        secret admin path + session rotation
db/             schema.mjs (idempotent DDL, shared by the app and `npm run migrate`) + migrate script
scripts/        mint-drive-token.mjs (Drive refresh token) · totp-setup.mjs (admin 2FA secret)
docs/           design spec + implementation plan
reference/      the earlier (rejected) Google Apps Script approach, kept for context
```

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and
guidelines, and the [Code of Conduct](./CODE_OF_CONDUCT.md). Security issues go
through [SECURITY.md](./SECURITY.md) (privately — never a public issue).

## Community

- **Website** — <https://rosu-web.vercel.app>
- **Instagram** — <https://www.instagram.com/rosu.app/>
- **X** — <https://x.com/RosuApp>
- **YouTube** — <https://www.youtube.com/@RosuApp>
- **Reddit** — <https://www.reddit.com/user/RosuApp/>
- **E-mail** — rosu.app@gmail.com

## License

[GPL-3.0-or-later](./LICENSE), matching the Rosu desktop app.

---

Rosu is **free, open-source, donation-only and non-commercial**. It is an **unofficial, fan-made tool — not affiliated with or endorsed by ppy Pty Ltd or osu!**. Contact: **rosu.app@gmail.com**
