# rosu-web — HANDOFF (read this first)

> **You are a fresh Claude chat with zero prior context. This document is your
> complete brief.** Read it fully before doing anything. It tells you what this
> project is, why it exists, exactly what to build, the constraints, what's
> already decided, and what to confirm with the owner. Talk to the owner in
> **Turkish** (they are Turkish-speaking); keep all repo content, code, commits
> and public copy in **English**.

---

## 0. TL;DR — what you're building

**rosu-web** is the web presence + backend for **Rosu**, a desktop app. It has
two jobs:

1. **A landing/home page for Rosu** — a small marketing site (what Rosu is,
   features, screenshots, a Download button pointing at the GitHub Releases).
2. **A bug-report / contact system** — a web page with a form (title,
   description, optional screenshot, contact e-mail) **and** an API endpoint that
   the Rosu **desktop app** also POSTs to directly. Every submission is stored in
   a **free database**; screenshots go to **free blob storage**; the owner reads
   the submissions.

**Hosting:** Vercel (the owner chose it). **Everything must be free** (owner
strongly prefers **no credit card** anywhere). No component may **sleep/pause on
idle** (a rarely-used contact form must always answer).

The single most important technical fact: **the desktop app already has a client
that POSTs a specific JSON shape** (see §4). Your API endpoint must accept that
shape (or you coordinate a change to the desktop app — see §8, cross-repo).

---

## 1. Repos & local paths

| What | GitHub | Local path |
|---|---|---|
| **rosu-web** (this project) | `https://github.com/Kerevizodunu2000/rosu-web` | `C:\Desktop\rosu-web` |
| **Rosu desktop app** | `https://github.com/Kerevizodunu2000/rosu` (PUBLIC, GPL-3.0) | `C:\Desktop\rosu` |

The desktop app repo is where the client (`rosu/report.py`, `rosu/ui/`) lives.
You will likely need to make a small change there too (§8).

The owner will connect this project to Vercel and wants you to work with Vercel
**via an MCP server** ("mcp server ile ona bağlacaksın") — i.e. once the Vercel
MCP is connected, you can create/inspect/deploy the Vercel project through it.

---

## 2. What Rosu is (context)

Rosu is a **Windows desktop app** (Python 3.13 / PySide6 / SQLite, shipped as a
single PyInstaller `rosu.exe`). It manages **osu!** beatmap pack archives:
unpack packs, dedup beatmapsets into a permanent Library, track everything in a
local SQLite DB, detect missing packs, import into osu!(stable)/osu!lazer, back
up to Google Drive. It's **free, open-source (GPL-3.0-or-later), donation-only,
non-commercial** (never paywalled). Official contact e-mail: **rosu.app@gmail.com**.

**Brand:** Rosu's accent color is **pink**. **Do NOT use ppy's osu! logo or
"osu!" branding as if official — it's a trademark.** Rosu is an unofficial,
fan-made tool ("not affiliated with or endorsed by ppy Pty Ltd or osu!"). Use
Rosu's own glyphs/marks. The Google-Drive "Connected" page in the desktop app
(`rosu/drive/auth.py`, `_result_page`) is a good reference for Rosu's visual
style (pink, rounded, light/dark aware).

---

## 3. Why rosu-web exists — decision history (so you don't re-litigate)

The bug-report / contact feature went through three iterations:

1. **In-app `mailto:` link** — rejected. On machines with no mail client it
   errors (`Cannot launch 'mailto:…': There is no mail program installed`) and
   just opens a browser. Bad UX.
2. **Google Apps Script Web App → Google Sheet + Drive** — fully built (see
   `reference/apps-script/`), then **rejected by the owner** as not what they
   want. Kept only as reference.
3. **➡ Vercel website + free DB** (CURRENT PLAN) — the owner wants a real
   website with a proper report/contact page; submissions saved to a free
   database. This is what you build.

The owner's words (paraphrased): *"I'll open a Vercel account, you'll connect to
it via an MCP server and build a homepage there. One of the pages will be a
report-a-bug / contact-us page, and what users write gets saved to our free
database. That's it."*

On the desktop side, the broken in-app report dialog + the `mailto:` links have
**already been removed** (the About screen now shows the e-mail as plain
selectable text). The desktop still contains a **reusable HTTP client**
(`rosu/report.py`) that can POST to your new endpoint (§4, §8).

---

## 4. The desktop-app contract (CRITICAL — match this)

The desktop app ships `rosu/report.py` with a function `submit_report(...)` that
builds and POSTs a **JSON body** (stdlib `urllib`, `Content-Type:
application/json`, `User-Agent: Rosu/<version>`). It currently points at an empty
`REPORT_ENDPOINT` (to be set to your Vercel API URL). **Your `POST /api/report`
must accept this exact shape:**

```jsonc
{
  "title":       "string, required, ≤ ~200 chars",
  "description": "string, required, ≤ ~5000 chars",
  "contact":     "string, optional (user e-mail so the owner can reply)",
  "app_version": "string, e.g. \"1.3.3\"",
  "os":          "string, e.g. \"Windows 11\"",
  "lang":        "string, \"en\" | \"tr\"",
  "token":       "string, optional shared friction token (see §7)",
  "hp":          "string, HONEYPOT — always \"\" from a real client; non-empty ⇒ drop",
  "image_b64":   "string, optional — base64 of a screenshot (client caps ~4 MB pre-encode)",
  "image_name":  "string, optional (do NOT trust; derive a safe name server-side)",
  "image_mime":  "string, optional — one of image/png|jpeg|gif|webp|bmp (validate!)"
}
```

**Expected response** (the client treats any non-`ok` as failure and shows a
fallback message):

```json
{ "ok": true,  "id": 123 }
{ "ok": false, "error": "some_reason" }
```

Notes:
- The client **follows redirects** and parses JSON. A Vercel API route returns
  JSON directly (no 302 dance the Apps Script needed) — simpler.
- The client swallows all network errors into `{"ok": false, "error": "offline"}`
  etc. — so your endpoint just needs to be correct + fast.
- `read_image_for_report()` in the client caps images at ~4 MB pre-encode and
  only allows `.png/.jpg/.jpeg/.gif/.webp/.bmp`.

**You have two "clients" for the same endpoint:**
- the **desktop app** (JSON POST above; can't do a captcha — relies on honeypot +
  shared token + rate limit), and
- the **web form** on your report page (a browser — **can** do a captcha like
  Cloudflare Turnstile / hCaptcha). Design `/api/report` to accept both: require
  a captcha token when the request comes from the web form, and accept the
  shared-token+honeypot path for the desktop app.

---

## 5. Recommended stack (research-backed; confirm with owner)

All free-tier facts below were verified in July 2026. **The decisive constraint
is "must not pause on idle."**

**Recommended:**
- **Host / framework:** **Vercel + Next.js (App Router)**. One project gives you
  both the marketing pages and the API route (`app/api/report/route.ts`). Vercel
  **Hobby** is free, **no card**, serverless functions ~1M invocations/mo. Hobby
  is **personal/non-commercial only** — fine for Rosu (non-commercial), but note
  it. Vercel functions cold-start but **never pause with an error**.
- **Database:** **Neon (serverless Postgres)** — free tier ~0.5 GB, **no card**,
  scale-to-zero that **auto-resumes** (brief cold start, not a manual restore).
  Integrates with Vercel via the marketplace. *Alternative:* **Turso** (SQLite,
  5 GB free, no card, **no pause**) if you prefer SQLite. **Do NOT use Supabase
  or Appwrite** — their free projects **pause after ~7 days idle and need a
  manual dashboard restore** (fatal for a rarely-hit form).
- **Image/blob storage:** the report may include a screenshot. Options:
  **Vercel Blob** (integrated, has a free allowance) or **Cloudinary** (no card,
  25 monthly credits, image-focused) → store the returned URL in the DB. Avoid
  Cloudflare R2 here (needs a card). *Cheap fallback:* store small screenshots as
  base64/`bytea` in Postgres — simplest, but watch the 0.5 GB Neon cap; a blob
  store is cleaner long-term.
- **Spam / abuse (public endpoint):** honeypot (`hp` field) + per-IP rate limit +
  request-size cap + input validation. On the **web form**, add **Cloudflare
  Turnstile** (free, browser-based) — now feasible because it's a real web page
  (it was NOT feasible in the desktop app). For the desktop path, the shared
  `token` + honeypot + rate limit are the friction.

**Money/card note:** Vercel Hobby, Neon, Turso, Cloudinary, hCaptcha/Turnstile
free tiers are all **no-card**. If any choice you make would require a card,
**stop and confirm with the owner first** — they explicitly prefer no card.

---

## 6. What to build (scope)

1. **Landing page** (`/`): Rosu hero (pink brand, own glyphs, NOT the osu! logo),
   a one-line pitch, a few feature highlights, screenshots, and a **Download**
   button → `https://github.com/Kerevizodunu2000/rosu/releases/latest`. Mention
   it's free / open-source / unofficial fan tool. Light + dark aware. Responsive.
2. **Report / Contact page** (`/report` or `/contact`): a form — title,
   description, optional screenshot upload, optional contact e-mail — plus a
   Turnstile widget. On submit → `POST /api/report` → thank-you state. Also show
   the plain e-mail (`rosu.app@gmail.com`) as a fallback.
3. **API route** `POST /api/report`:
   - Parse JSON. Reject non-object / missing title|description. Enforce length
     caps. **Honeypot:** if `hp` non-empty, return `{ok:true}` and store nothing.
   - **Verify** either a Turnstile token (web) **or** the shared token+honeypot
     (desktop). Rate-limit per IP.
   - If an image is present: validate `image_mime` against the allow-list, decode
     base64, enforce a server-side size cap, upload to blob storage, keep the URL.
     **Never trust `image_name`** — generate a safe server-side name.
   - Insert a row: `{ created_at, title, description, app_version, os, lang,
     contact, image_url, source: "app"|"web", ip_hash? }`.
   - Return `{ok:true, id}`.
4. **Reading submissions (owner):** simplest = the **Neon/Turso console** or a
   DB GUI. Optional nicer path = a **password-protected `/admin`** page (env-var
   password or a simple auth) that lists rows with image thumbnails. Ask the
   owner which they want.
5. **Cross-repo wiring (desktop app, `C:\Desktop\rosu`):** after the API is live,
   set `REPORT_ENDPOINT` in `rosu/report.py` to `https://<deploy>/api/report`,
   and re-add an in-app entry point. Two options to offer the owner: (a) a Settings
   button that **opens the web report page** in the browser (simplest), or (b)
   re-enable an in-app dialog that **POSTs to `/api/report`** (the code
   `rosu/ui/report_dialog.py` + `rosu/report.py` still exist and are reusable —
   only the Settings button + its handler were removed). This is a **separate PR
   in the rosu repo**, following that repo's ship discipline (see its CLAUDE.md).

---

## 7. Constraints & non-negotiables

- **Free + no card** everywhere (confirm before choosing anything card-gated).
- **No idle-pause** components (rules out Supabase/Appwrite free tiers).
- **Privacy:** submissions contain only what the user types + basic diagnostics
  (app version, OS, UI language) + an optional screenshot the user attaches. No
  hidden telemetry. Disclose on the form what is sent. Don't log raw IPs long-term
  (hash if you need per-IP rate limiting).
- **Brand/trademark:** pink Rosu brand; **do not present osu!'s logo/branding as
  official**; label Rosu as an unofficial fan-made tool.
- **Language:** all repo content, code, comments, commits, and public site copy
  in **English**. Speak Turkish only when chatting with the owner. (The desktop
  app UI itself is bilingual en/tr; if you localize the site, mirror that, but
  English-first.)
- **License:** the desktop app is GPL-3.0-or-later. **rosu-web's license is an
  open decision** (§9) — a website could be MIT, or match GPL. Ask the owner;
  don't add a LICENSE file unilaterally.
- **Secrets:** DB connection strings, Cloudinary keys, Turnstile secret, admin
  password → **Vercel environment variables only**, never committed. Add a
  `.env.example` documenting the names (no values).
- **Security-review discipline:** the desktop repo runs an adversarial code +
  security review before shipping each version. Apply the same rigor here for the
  public API route (injection, SSRF, size limits, auth, rate limits).

---

## 8. Open decisions to confirm with the owner (ask these early)

1. **Database:** Neon (Postgres) vs Turso (SQLite)? (Recommend Neon for Vercel
   integration; Turso if SQLite preferred.)
2. **Image storage:** Vercel Blob vs Cloudinary vs base64-in-DB? (Confirm no-card.)
3. **Report entry from the app:** open the web page in a browser, or an in-app
   dialog POSTing to the API? (Recommend the browser link for simplicity.)
4. **Admin reading:** DB console only, or a protected `/admin` page in the site?
5. **Repo visibility & license:** is `rosu-web` public or private? What license?
6. **Domain:** `rosu-web.vercel.app` (default) or a custom domain later?
7. **Framework certainty:** Next.js OK? (It's the natural Vercel choice.)

---

## 9. Owner action items (things only the owner can do)

- Create/confirm the **Vercel account** and connect the `rosu-web` GitHub repo.
- Connect the **Vercel MCP** so this chat can drive the Vercel project.
- Provision the **database** (e.g. Neon via the Vercel integration) and the
  **blob/image** store; set the **environment variables** in Vercel.
- (If using Turnstile) create a **Cloudflare Turnstile** site+secret key (free).
- After deploy, hand back the **production URL** so the desktop `REPORT_ENDPOINT`
  can be set.

---

## 10. Proposed project structure (adjust after scaffolding)

```
rosu-web/
├── HANDOFF.md              ← this file
├── README.md               ← project intro + quickstart
├── .gitignore
├── .env.example            ← names of required env vars (no values)
├── app/                    ← Next.js App Router
│   ├── page.tsx            ← landing page
│   ├── report/page.tsx     ← report/contact form
│   ├── api/report/route.ts ← POST endpoint (desktop + web)
│   └── admin/page.tsx      ← (optional) protected submissions viewer
├── lib/                    ← db client, blob upload, validation, rate-limit
├── components/             ← UI components (brand, form, etc.)
├── public/                 ← static assets (Rosu glyphs, screenshots)
└── reference/
    └── apps-script/        ← the REJECTED Apps Script approach, kept for context
        ├── Code.gs
        └── README.md
```

Scaffold with `create-next-app` (TypeScript, App Router, Tailwind is fine) once
the stack is confirmed. Keep `reference/` — it documents the prior approach.

---

## 11. Suggested first steps for the new chat

1. Read this whole file + skim `reference/apps-script/` (prior approach) and, in
   the desktop repo, `C:\Desktop\rosu\rosu\report.py` (the exact client contract).
2. Ask the owner the §8 questions (Turkish, batched).
3. Confirm the Vercel MCP is connected; confirm no-card DB + image choices.
4. `create-next-app` scaffold → landing page (brand) → report form + Turnstile →
   `/api/report` (validation, honeypot, rate limit, image→blob, DB insert).
5. Deploy to Vercel; smoke-test the endpoint with the exact desktop payload (§4).
6. Cross-repo: set `REPORT_ENDPOINT` in the desktop `rosu/report.py` and re-add
   the app's report entry point (separate PR in the `rosu` repo, its discipline).
7. Adversarial security review of the public API before considering it done.

---

## 12. Reference material in this repo

- `reference/apps-script/Code.gs` + `README.md` — the **rejected** Google Apps
  Script backend (Web App → Google Sheet + Drive). Not used; kept because its
  validation/honeypot/rate-limit/formula-injection logic and its free-tier
  research are a useful starting point for the same concerns on Vercel.

Good luck. Build it clean, keep it free, keep it honest about what data is sent.
