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
- A **daily Vercel Cron** (plus a manual "Archive now" button) bundles pending reports + images into a ZIP in Drive and empties the staging area — so no small-quota store ever fills.
- The public endpoint is defended by a **honeypot**, **Cloudflare Turnstile** (web form), a **shared token** (desktop app), and **per-IP + global rate limits**. IPs are only ever stored as a salted hash.

## Tech stack

| Layer | Choice |
|---|---|
| Framework / host | **Next.js 16** (App Router, TypeScript) on **Vercel** (Hobby) |
| Database | **Neon** — serverless Postgres, no card, auto-resume |
| Image / archive storage | **Google Drive** (`drive.file` scope, OAuth refresh token) |
| Web-form captcha | **Cloudflare Turnstile** |
| Admin session | signed JWT cookie (`jose`) |
| Archives | in-memory ZIP (`jszip`) |
| Tests | **Vitest** |

## Pages & API

| Route | What |
|---|---|
| `/` | Landing page (screenshots open in an accessible lightbox) |
| `/report` | Report / contact form (Turnstile-protected) |
| `/privacy` | Privacy Policy — bilingual (EN + TR) |
| `/terms` | Terms — bilingual (EN + TR) |
| `/admin` | Password-protected submissions viewer |
| `POST /api/report` | Accepts the desktop app **and** the web form |
| `GET /api/cron/archive` | Daily archive job (Vercel Cron) |
| `POST /api/admin/{login,logout,archive}` | Admin session + manual archive |
| `GET /api/admin/image/[id]` | Auth-gated Drive image proxy (never a public URL) |

## Local development

```bash
npm install
cp .env.example .env.local      # then fill in the values (see below)
npm run migrate                 # create the Neon tables (needs DATABASE_URL)
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

## Privacy

A submission contains only what the user types (title, description, optional contact e-mail), light diagnostics (app version, OS, UI language) and an optional screenshot the user attaches. No hidden telemetry. Raw IPs are never stored — only a salted hash, used solely for rate-limiting. What's sent is disclosed on the form, and the full bilingual (EN + TR) policy is published at [`/privacy`](https://rosu-web.vercel.app/privacy).

## Project structure

```
app/            App Router — (site) group (landing + report), admin, api routes
lib/            db, drive, validation, ratelimit, turnstile, session, zip, report/archive services
components/      Nav, Footer, Brand, ReportForm, Disclosure, AdminTable
db/             schema.sql + migrate script
scripts/        mint-drive-token.mjs (one-time Drive refresh-token helper)
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
