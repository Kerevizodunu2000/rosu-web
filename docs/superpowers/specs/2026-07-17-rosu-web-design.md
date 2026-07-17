# rosu-web — Design Spec

_Status: approved by owner (2026-07-17). Source of truth for the implementation plan._

## 1. Overview

`rosu-web` is the web presence + backend for **Rosu**, a free, open-source
(GPL-3.0-or-later), non-commercial Windows desktop app that manages osu! beatmap
pack archives. It has two jobs:

1. **Landing page** — a small marketing site (what Rosu is, features, screenshots,
   a Download button pointing at GitHub Releases).
2. **Bug-report / contact system** — a web form **and** an API endpoint
   (`POST /api/report`) that the Rosu desktop app also POSTs to directly.
   Submissions are stored in a free database; screenshots go to the owner's
   Google Drive; the owner reads submissions through a protected `/admin` page.

**Hosting:** Vercel (Hobby, personal/non-commercial — fits Rosu). Everything must
be **free**, require **no credit card**, and **never pause on idle** (a rarely-hit
contact form must always answer).

## 2. Goals / Non-goals

**Goals**
- Accept the desktop app's exact existing JSON contract (§6) without changing it.
- Keep all storage in free, no-card, no-pause services owned by the owner.
- Keep user screenshots **private** (owner's Drive, never a public URL).
- Real spam/abuse protection on a public write endpoint.
- Owner can read submissions easily (protected `/admin`).

**Non-goals (YAGNI)**
- No user accounts, no multi-tenant, no analytics/telemetry.
- No Vercel Blob, no Cloudinary, no email service (Drive replaces all of these).
- No i18n of the site at launch (English-first; may mirror desktop en/tr later).

## 3. Constraints (non-negotiable)

- **Free + no credit card** everywhere. If any choice would require a card, stop
  and confirm with the owner first.
- **No idle-pause** components (rules out Supabase/Appwrite free tiers). Neon
  scale-to-zero **auto-resumes** on query — acceptable.
- **Privacy:** store only what the user types + light diagnostics (app version,
  OS, UI language) + an optional screenshot the user attaches. No hidden
  telemetry. Disclose on the form what is sent. Never store raw IPs — salted hash
  only, used for rate limiting.
- **Brand/trademark:** pink Rosu brand, Rosu's own glyphs. Do **not** present
  osu!'s logo/branding as official; label Rosu as an unofficial fan-made tool
  ("not affiliated with or endorsed by ppy Pty Ltd or osu!").
- **Language:** all repo content, code, comments, commits, and public site copy
  in **English**. (Owner conversations are in Turkish.)
- **License:** GPL-3.0-or-later (LICENSE file + SPDX headers), matching the
  desktop app.
- **Repo visibility:** public.
- **Secrets:** DB URL, Google OAuth client + refresh token, Turnstile secret,
  admin password, hashing salt, cron secret → **Vercel environment variables
  only**, never committed. `.env.example` documents the names (no values).

## 4. Stack

- **Framework/host:** Next.js (App Router) + TypeScript + Tailwind, on Vercel Hobby.
- **Database:** **Neon** (serverless Postgres) — free, no card, auto-resume.
- **Image + archive storage:** **Google Drive** on the `rosu.app@gmail.com`
  account (15 GB free), reusing the **existing OAuth client** from the desktop
  app's Drive backup (`rosu/drive/`), scope `drive.file`. No Vercel Blob.
- **Web-form captcha:** **Cloudflare Turnstile** (free, no card).
- **Cron:** Vercel Cron (Hobby: once/day) for periodic archiving, plus a manual
  "Archive now" button in `/admin`.

## 5. Architecture & data flow

### 5.1 Report submission — `POST /api/report` (desktop **and** web)

1. Parse JSON. Reject if not an object, or if `title`/`description` missing.
   Enforce length caps (title ≤ 200, description ≤ 5000, contact ≤ 200) and a
   total body-size cap (~6 MB, matching the desktop client's ~4 MB pre-encode
   image → ~5.5 MB base64).
2. **Honeypot:** if `hp` is non-empty, return `{ok:true, id:0}` and store nothing.
3. **Verification (dual-path):**
   - **Web** requests carry a Turnstile token → verify server-side against
     `TURNSTILE_SECRET_KEY`. `source = "web"`.
   - **Desktop** requests (`User-Agent: Rosu/<ver>`, no Turnstile token) → require
     the shared `token` to equal `REPORT_APP_TOKEN`. `source = "app"`.
   - Both paths are additionally rate-limited per IP-hash and size-capped.
4. **Rate limit:** per salted IP-hash sliding window (e.g. ≤ 5/min, ≤ 30/day) +
   a global/day backstop. Backed by a Neon `rate_events` table.
5. Insert the text row into Neon → obtain `id`. Return `{ok:true, id}` promptly.
6. **Image (optional):** validate `image_mime` against the allow-list
   (`png|jpeg|gif|webp|bmp`) and check magic bytes; decode base64; enforce a
   server-side size cap; upload to Drive **`Rosu Reports/Inbox`** with a
   **server-generated** safe name (never trust `image_name`); store the returned
   Drive file id + `image_status='stored'` on the row. On failure, mark
   `image_status='error'` (the text report is still saved).

Response shape (desktop client treats any non-`ok` as failure):
```json
{ "ok": true,  "id": 123 }
{ "ok": false, "error": "some_reason" }
```

### 5.2 Periodic archiving — `GET /api/cron/archive` (Vercel Cron + manual)

- Protected by `CRON_SECRET` (Vercel Cron header) or an authenticated `/admin`
  session for the manual button.
- Gather un-archived reports (from Neon) + their Drive `Inbox` images → build a
  **ZIP in memory** containing `reports.json` (+ `reports.csv`) and the images →
  upload the ZIP to **`Rosu Reports/Archives/rosu-reports-YYYYMMDD.zip`** →
  mark those rows `archived` (set `archive_ref`, `archived_at`) → delete the
  now-archived `Inbox` images.
- Net effect: no small-quota store is ever used; everything lives in the owner's
  15 GB Drive as tidy, self-contained ZIPs. (The ZIP consolidation is for
  tidiness/portability, not a quota necessity — Drive is roomy.)

## 6. Desktop-app contract (must match exactly)

The desktop `rosu/report.py` POSTs this JSON (stdlib urllib,
`Content-Type: application/json`, `User-Agent: Rosu/<version>`, follows
redirects, parses JSON):

```jsonc
{
  "title":       "string, required, ≤ ~200 chars",
  "description": "string, required, ≤ ~5000 chars",
  "contact":     "string, optional (user e-mail)",
  "app_version": "string, e.g. \"1.3.3\"",
  "os":          "string, e.g. \"Windows 11\"",
  "lang":        "string, \"en\" | \"tr\"",
  "token":       "string, optional shared friction token",
  "hp":          "string honeypot — always \"\" from a real client; non-empty ⇒ drop",
  "image_b64":   "string, optional base64 screenshot (client caps ~4 MB pre-encode)",
  "image_name":  "string, optional — do NOT trust; derive a safe name server-side",
  "image_mime":  "string, optional — one of image/png|jpeg|gif|webp|bmp (validate!)"
}
```

The endpoint must accept both the desktop path (honeypot + shared token + rate
limit) and the web path (Turnstile).

## 7. Data model (Neon / Postgres)

```
reports(
  id            bigserial primary key,
  created_at    timestamptz not null default now(),
  source        text not null,              -- 'app' | 'web'
  title         text not null,
  description   text not null,
  contact       text,
  app_version   text,
  os            text,
  lang          text,
  ip_hash       text,                       -- salted hash, never a raw IP
  image_status  text not null default 'none', -- 'none'|'stored'|'archived'|'error'
  image_drive_id text,                       -- Drive file id while staged in Inbox
  image_name    text,                        -- server-derived safe name
  image_mime    text,
  archive_ref   text,                        -- archive zip name/id once archived
  archived_at   timestamptz
)

rate_events(
  ip_hash    text not null,
  created_at timestamptz not null default now()
)                                            -- pruned periodically
```

## 8. Google Drive integration

- Reuse the desktop OAuth client (`client_id` / `client_secret` from
  `rosu/drive/oauth_client.json`, Google Cloud project `rosu-502612`), scope
  `drive.file` (app sees only files it created — no Google app verification
  needed). The web backend creates and manages its own `Rosu Reports` folder;
  it cannot see the desktop's backup files (good isolation).
- **Server-side auth:** a **refresh token** for `rosu.app@gmail.com`, obtained
  **once** via consent, stored as `GOOGLE_REFRESH_TOKEN` in Vercel env. The
  serverless functions exchange it for short-lived access tokens (same token
  endpoint / logic as `rosu/drive/auth.py`, ported to TypeScript over `fetch`).
- **Drive ops** needed (port of `rosu/drive/client.py`): ensure-folder,
  upload-file (simple/multipart is fine for these small files), list-folder,
  download-file, delete-file. Admin image display streams via a server proxy.

## 9. Spam / abuse controls

Honeypot (`hp`) · Turnstile (web) · shared `REPORT_APP_TOKEN` (desktop) · per
IP-hash rate limit + global/day backstop (Neon) · request body-size cap · MIME
allow-list + magic-byte check · server-generated filenames · salted IP hashing
(no raw IPs). Admin login is also rate-limited.

## 10. Admin viewer — `/admin`

- Password login (`ADMIN_PASSWORD`, compared in constant time) → signed,
  httpOnly session cookie (secret: `ADMIN_SESSION_SECRET`). Login endpoint
  rate-limited.
- Lists recent (un-archived) reports with thumbnails; thumbnails are streamed
  through a server proxy `GET /api/admin/image/[id]` (reads the Drive file with
  the refresh token — never a public URL). Archived reports link to the Drive ZIP.
- "Archive now" button → triggers the archive job.

## 11. Pages & routes

```
app/
  page.tsx                         landing (pink brand, own glyphs, Download → Releases)
  report/page.tsx                  form (title, desc, optional screenshot, optional email)
                                   + Turnstile + thank-you state + rosu.app@gmail.com fallback
  admin/page.tsx                   protected submissions viewer
  api/report/route.ts              POST endpoint (desktop + web)
  api/admin/login/route.ts         admin password login → session cookie
  api/admin/image/[id]/route.ts    Drive image proxy (auth required)
  api/cron/archive/route.ts        periodic archive (cron + manual)
lib/
  db.ts            Neon client + queries
  drive.ts         OAuth refresh + Drive REST (folder/upload/list/download/delete)
  validation.ts    parse + length/size/MIME checks, safe filename
  ratelimit.ts     per-IP-hash sliding window
  turnstile.ts     verify web captcha token
  session.ts       admin cookie sign/verify
  zip.ts           build archive ZIP in memory
components/         brand, form, admin table, etc.
public/            Rosu glyphs, screenshots
```

## 12. Environment variables (names only — values in Vercel)

```
DATABASE_URL                     # Neon pooled Postgres connection string
GOOGLE_OAUTH_CLIENT_ID           # from existing rosu OAuth client
GOOGLE_OAUTH_CLIENT_SECRET       # from existing rosu OAuth client
GOOGLE_REFRESH_TOKEN             # one-time consent as rosu.app@gmail.com
GOOGLE_DRIVE_ROOT_FOLDER         # optional; default "Rosu Reports"
NEXT_PUBLIC_TURNSTILE_SITE_KEY   # public Turnstile site key
TURNSTILE_SECRET_KEY             # Turnstile secret
REPORT_APP_TOKEN                 # shared desktop friction token (matches rosu/report.py)
ADMIN_PASSWORD                   # admin login password
ADMIN_SESSION_SECRET             # signs the admin session cookie
IP_HASH_SALT                     # salt for hashing IPs
CRON_SECRET                      # protects the cron archive route
```

## 13. Phase 2 — cross-repo wiring (separate PR in `rosu`)

After the API is live: set `REPORT_ENDPOINT` in `rosu/report.py` to the deploy
URL, and re-add a Settings entry point that **opens `/report` in the browser**
(owner's chosen option — simplest; the web form's Turnstile provides the
protection the in-app dialog couldn't). Follow the `rosu` repo's ship discipline.

## 14. Owner action items

- Connect Vercel + the `rosu-web` GitHub repo; authenticate the Vercel MCP
  (`/mcp`) so this chat can drive the project.
- Provision Neon (via the Vercel integration) → `DATABASE_URL`.
- Mint `GOOGLE_REFRESH_TOKEN` via a one-time consent as `rosu.app@gmail.com`
  (assistant supplies a small script) → set the three `GOOGLE_*` vars.
- Create a free Cloudflare Turnstile widget → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` +
  `TURNSTILE_SECRET_KEY`.
- Choose `ADMIN_PASSWORD`; the assistant generates `ADMIN_SESSION_SECRET`,
  `IP_HASH_SALT`, `CRON_SECRET`, and `REPORT_APP_TOKEN`.
- Provide brand assets (Rosu glyph/logo, a few screenshots) or approve ones the
  assistant sources from the desktop repo.
- After deploy, hand back the production URL for the desktop `REPORT_ENDPOINT`.

## 15. Security review gate

Before "done": adversarial review of the public API route — injection, SSRF,
body-size/DoS limits, base64/MIME validation, auth on admin + cron, rate-limit
correctness, secret handling, and confirmation that no raw IPs or secrets are
logged or committed.
