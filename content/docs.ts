// SPDX-License-Identifier: GPL-3.0-or-later
// The /docs and /docs/api pages, as Markdown (the subset in lib/markdown.ts).

export const GUIDE = `## Install

1. Download the latest \`rosu-vX.Y.Z-win64.exe\` from the [changelog](/changelog) or GitHub Releases. Put it in its own folder: Rosu keeps its working folders next to the exe.
2. Windows SmartScreen may say "unknown publisher" the first time, because the exe is not code-signed. Choose **More info → Run anyway**. You can check the download against the \`.sha256\` file published next to it.
3. On first start, Rosu creates \`Packs/\`, \`Output/\`, \`Library/\`, \`data/\` and \`logs/\` beside the exe. You can point each one somewhere else in **Settings**.

## The everyday flow

1. **Drop packs into \`Packs/\`.** Rosu reads \`.zip\`, \`.7z\` and \`.tar\` archives as well as loose \`.osz\` files. Every archive is security-checked before extraction (size caps, zip-bomb and path-traversal guards).
2. **Dashboard → Unpack Archives.** The beatmap sets land in \`Output/\`. Rosu records every set and which pack it came from.
3. **Copy to Library.** \`Library/\` is your permanent, deduplicated collection: one \`.osz\` per beatmap set, whatever pack it arrived in.
4. **Import to osu!.** Send the new sets to osu!lazer or osu!(stable) in one click. Each client can be turned on or off in Settings, and a turned-off client disappears from the whole app.

## Finding things

- **Search** ranks by artist, title and set name, and understands filters such as \`star>5 mode=mania key=7 bpm>=180 length<3:00 mapper=name\`. The **Filters** panel builds the same queries visually.
- **Where** shows where each set lives: 🎮 osu!lazer · 🕹️ osu!(stable) · 💾 Library · ☁️ Drive.
- Double-click a set for **Map Details**: every difficulty with its star rating, and a skillset radar for osu!mania.
- The **Packs** tab lists every pack series and flags the numbers you are missing.

## Shortcuts

One-click flows, each run as a job in the queue (live progress, cancel at any time):

- Transfer sets between osu!lazer and osu!(stable), skipping what the target already has.
- Save everything a client has installed into the Library.
- Export {Library, Drive-backed, a client, everything} to zip or 7z, optionally split into volumes and uploaded to Drive with a share link.
- **Prune** to reclaim disk space (videos, large images). There is a per-set preview first, everything removed goes to the Recycle Bin, and you can restore it later.
- **Remove from osu!** (v1.8): take sets out of a client, optionally saving them to the Library first.
- **Browse Drive backup** (v1.8): see everything in your Drive backup and restore chosen sets.

## Google Drive backup

**Settings → Drive → Connect** signs in with your Google account using the minimal \`drive.file\` permission, so Rosu can only ever see files it created. Backups upload only what is new, as chunk archives (1 GB by default) or one file per set. Several PCs can back up into the same Drive; the backup browser shows them all.

## When something breaks

- **Settings → Report a problem** sends a short report, with an optional screenshot, to the maintainer and shows you a private link to follow its status.
- **Settings → Send anonymous crash reports** (off by default): if something crashes, Rosu sends only the error type and the code locations involved. Details are on the [privacy page](/privacy).
- The **Logs** tab shows what Rosu did, line by line.

Rosu is free and open source (GPL-3.0-or-later), and unofficial: it is not affiliated with or endorsed by ppy Pty Ltd or osu!.`

export const API = `This page documents the public endpoints the Rosu desktop app talks to. They are open source and stable; additive changes only.

## \`POST /api/report\`

A bug report or message, from the desktop app or the web form. Send JSON with \`Content-Type: application/json\`.

- \`title\` (required, ≤ 200 chars) and \`description\` (required, ≤ 5000 chars)
- \`contact\`: optional e-mail address (≤ 200 chars)
- \`app_version\`, \`os\`, \`lang\` (\`en\` / \`tr\`): light diagnostics
- \`token\`: the desktop app's shared token (desktop path only; checked in constant time)
- \`hp\`: honeypot, always empty from a real client
- \`image_b64\`, \`image_mime\` (\`image/png|jpeg|gif|webp|bmp\`), \`image_name\`: optional screenshot, at most 3 MB decoded. The server checks the magic bytes and generates its own file name.
- \`ack_email\`: optional \`true\` to ask for a one-time confirmation e-mail (web form, when enabled)

The desktop path is recognised by \`User-Agent: Rosu/<version>\` plus the token. The web path needs a Cloudflare Turnstile token (\`turnstileToken\`).

Response:

\`\`\`json
{ "ok": true, "id": 123, "status_url": "https://rosu-web.vercel.app/report/status/…" }
{ "ok": false, "error": "rate_minute" }
\`\`\`

Errors: \`missing_fields\`, \`bad_json\`, \`captcha\`, \`unauthorized\`, \`rate_minute\`, \`rate_day\`, \`rate_global\`, \`too_large\` (HTTP 413), \`server\`. Treat anything without \`ok: true\` as a failure. \`status_url\` (since v1.3.0) is the reporter's private tracking page; only a hash of it is stored.

## \`POST /api/crash\`

Opt-in crash fingerprint from the desktop app (\`User-Agent: Rosu/<version>\` + \`token\`).

\`\`\`json
{ "exc_type": "zipfile.BadZipFile", "message": "…", "frames": ["rosu/library.py:copy_to_library", "zipfile.py:open"],
  "app_version": "1.8.0", "os": "Windows 11", "token": "…" }
\`\`\`

The server clips and scrubs the message (paths and e-mail addresses), keeps only \`module:function\` frames, and computes the fingerprint itself. Body ≤ 32 KB. Response: \`{ "ok": true, "fingerprint": "…" }\`.

## \`GET /api/latest-version\`

The latest published desktop release, used by the in-app update check. It is CDN-cached.

\`\`\`json
{ "ok": true, "version": "1.8.0", "tag": "v1.8.0", "name": "Rosu v1.8.0 — …",
  "published_at": "…", "url": "https://github.com/Kerevizodunu2000/rosu/releases/tag/v1.8.0",
  "download_url": "https://github.com/…/rosu-v1.8.0-win64.exe", "sha256_url": "…", "notes": "…" }
\`\`\`

## \`GET /api/health\`

\`{ "ok": true, "db": "ok" }\` for uptime monitors. \`db\` is \`"down"\` when the database does not answer.`
