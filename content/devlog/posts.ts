// SPDX-License-Identifier: GPL-3.0-or-later
// Devlog posts. Each body is Markdown (the subset in lib/markdown.ts). Add a post
// by appending an object; the index, the post page and the sitemap pick it up.
import type { Post } from '@/lib/devlog'

export const POSTS: Post[] = [
  {
    slug: 'zero-budget-bug-report-pipeline',
    title: 'A zero-budget bug-report pipeline',
    date: '2026-10-20',
    summary:
      'How a free desktop app gets a real "Report a problem" button — form, API, storage, spam protection and an admin panel — without paying for anything or asking for a credit card.',
    body: `Rosu is a free Windows app for people who hoard osu! beatmap packs. For a long time, the only way to tell me something was broken was an e-mail address in the About box. Most people never write an e-mail about a bug. They just stop using the app.

So I wanted a proper **Report a problem** button: type what happened, attach a screenshot, press send. The catch was the budget, which is exactly zero. Rosu is not a business and never will be, so every piece had to be free, need no credit card, and never fall asleep when nobody has used it for a week.

## The shape of it

- **One endpoint for two clients.** The desktop app and the web form at [/report](/report) both send the same JSON to \`POST /api/report\`. The app sends it directly from Python with nothing but the standard library.
- **Neon Postgres** stores the report text. It is used as a small query index, not as a place to keep files: rate limiting, report numbers, the admin list and archive bookkeeping all need queries, and Google Drive is not a query engine.
- **Google Drive** stores screenshots, in the project account's private Drive, never behind a public URL. It is the same OAuth client the desktop app already uses for backups, with the minimal \`drive.file\` scope.
- **A nightly Vercel Cron job** bundles pending reports and their images into one dated ZIP in Drive and empties the staging folder. Since v1.3 the same job also enforces the 12-month retention promised on the privacy page.

## Keeping spam out without accounts

A public write endpoint attracts junk, so it has several layers:

1. A **honeypot** field that real users never see. Bots fill it in, get a cheerful "thanks", and nothing is stored.
2. **Cloudflare Turnstile** on the web form.
3. A shared token from the desktop app. This is friction, not real authentication, since anyone can extract it from the exe.
4. **Per-address and global rate limits**, backed by Postgres. IP addresses are only ever stored as salted hashes, and since v1.3 they are grouped per IPv6 /64.
5. Size caps, a MIME allow-list, magic-byte checks, and file names the server generates itself.

## The admin side

There is a small admin page, protected by a password, an optional authenticator code and server-side sessions. It lists reports, shows screenshots through a proxy that checks the session, and lets me set each report's status. Reporters can follow that status through a private link, with no account needed.

## What it costs

Nothing. Vercel Hobby, Neon free tier, a Drive account that already existed, and Turnstile are all free and need no card. The whole thing is open source under GPL-3.0-or-later: [rosu-web on GitHub](https://github.com/Kerevizodunu2000/rosu-web).

If you use Rosu and something misbehaves, that button now goes somewhere real.`,
  },
]
