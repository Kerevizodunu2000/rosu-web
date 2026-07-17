# rosu-web — the bug-report backend

Rosu's in-app **"Report a problem"** form posts to a tiny free web endpoint that
saves each report to a Google Sheet (and any screenshot to a Drive folder). This
folder holds that endpoint: a single Google **Apps Script** Web App (`Code.gs`).

**"Our website" = the Apps Script Web App (its `/exec` URL). "Our database" = the
Google Sheet.** Both live under the **rosu.app@gmail.com** account. It is
completely free — no server, no database service, no credit card, no Workspace.

The desktop client side lives in `rosu/report.py` (`submit_report`) and
`rosu/ui/report_dialog.py`.

---

## Why this stack (and that it's genuinely free)

Verified July 2026 against Google's official docs:

- **Free.** Apps Script has no fee on a consumer Gmail account; publishing a Web
  App costs nothing.
- **Anonymous access works.** Deployed with *Who has access = **Anyone***, the
  `/exec` URL accepts a plain `urllib` POST with **no auth and no login**. (In
  the current UI, **"Anyone"** = anonymous; "Anyone with Google account" would
  require sign-in — we do **not** want that one.)
- **No consent / no "unverified app" for users.** With *Execute as = **Me***, the
  script always runs as the owner and callers authorize nothing — random users
  never see a Google consent or verification screen. The owner authorizes **once**
  at deploy (and clicks past one "unverified app → Advanced → Go to (unsafe)").
- **Never sleeps.** Web apps are not deactivated when idle (unlike Supabase/
  Appwrite free projects, which pause after ~7 days).
- **No hard daily request cap.** Google's quota page lists no per-day cap on
  web-app invocations, Sheet row-appends, or Drive image-file creations. Limits
  that do apply: 6 min/execution, 30 simultaneous executions, and Drive storage.

### The two things to manage (honest gotchas)
1. **Drive 15 GB.** Every consumer Google account has 15 GB shared across Gmail +
   Drive + Photos. Saved screenshots count against it. `Code.gs` caps each image
   (`MAX_IMAGE_B64`) and caps total submissions/day (`GLOBAL_PER_DAY`) so abuse
   can't fill it quickly — but **prune the images folder periodically**.
2. **Keep the `/exec` URL stable on updates** (see "Updating" below) — using
   *New deployment* instead of a new *version* would mint a new URL and break
   every shipped exe.

The endpoint is public, so `Code.gs` uses **friction, not authentication**:
honeypot field, per-minute + per-day global caps, length/size limits, and an
optional shared token (`APP_TOKEN`).

---

## One-time setup (rosu.app@gmail.com)

1. **Create the database (Sheet).** In Google Drive (as rosu.app@gmail.com) →
   New → Google Sheets. Name it e.g. *Rosu Reports*. Copy its ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`.
   (The script adds a `Reports` tab with headers on the first submission.)
2. **Create the images folder (Drive).** New → Folder, e.g. *Rosu Report Images*.
   Copy its ID from the URL:
   `https://drive.google.com/drive/folders/`**`<FOLDER_ID>`**.
3. **Create the script.** Go to <https://script.google.com> → **New project**.
   Delete the placeholder, paste **all of `Code.gs`**, and set the two IDs at the
   top (`SHEET_ID`, `FOLDER_ID`). Save.
4. **Deploy.** Deploy → **New deployment** → gear icon → **Web app**.
   - *Description:* `rosu-report`
   - *Execute as:* **Me (rosu.app@gmail.com)**
   - *Who has access:* **Anyone**
   - Click **Deploy** → **Authorize access** → pick rosu.app → on "Google hasn't
     verified this app", click **Advanced → Go to … (unsafe)** → **Allow**.
     (This one-time screen is the owner's; end users never see it.)
5. **Copy the Web app URL** (ends in `/exec`).
6. **Smoke-test:** open that `/exec` URL in a browser — it should return
   `{"ok":true,"service":"rosu-report","ready":true}` (that's `doGet`).
7. **Give the `/exec` URL to the developer**, who bakes it into
   `rosu/report.py` (`REPORT_ENDPOINT`) before the release is tagged.

Optional stronger friction: set `APP_TOKEN` in `Code.gs` to a random string and
set the **same** value as `REPORT_TOKEN` in `rosu/report.py`. (Because Rosu is
open-source, a committed token isn't truly secret — it only deters casual bots.)

---

## Reading reports

Open the **Rosu Reports** Sheet — one row per submission (timestamp, title,
description, app version, OS, language, contact e-mail, image link). Click an
image link to view the screenshot in the Drive folder. That's the whole
"database UI" — no extra code.

---

## Updating `Code.gs` later (keep the SAME URL)

Do **not** create a *New deployment* — that changes the `/exec` URL and breaks
already-shipped exes. Instead:

1. Edit `Code.gs`, Save.
2. Deploy → **Manage deployments** → select the existing deployment → **Edit**
   (pencil) → **Version: New version** → **Deploy**.

This ships the new code under the **same deployment ID and same `/exec` URL**.
If you add a new Google service/scope, Google will prompt the **owner** to
re-authorize once (callers still never authorize anything).

---

## Files
- `Code.gs` — the Apps Script Web App (`doPost` saves a row + image; `doGet` is a
  health check). Fill in `SHEET_ID` / `FOLDER_ID` before deploying.
