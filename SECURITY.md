# Security Policy

rosu-web is the website and bug-report backend for the Rosu desktop app, running
at <https://rosu-web.vercel.app>. It handles modest amounts of personal data
(bug reports with optional contact e-mails and screenshots), so security reports
are taken seriously — thank you for looking.

## Supported versions

The live deployment always runs the latest `main` / latest `vX.Y.Z` tag. Only the
current release receives fixes.

| Version | Supported |
| ------- | --------- |
| latest release (live site) | ✅ |
| anything older | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

- E-mail **rosu.app@gmail.com** with the details (steps to reproduce, impact,
  affected route/component). Turkish or English are both fine.
- Alternatively, use GitHub's
  [private vulnerability reporting](https://github.com/Kerevizodunu2000/rosu-web/security/advisories/new)
  if you prefer.

You can expect an acknowledgement within **72 hours** and a status update within
**7 days**. This is a free, donation-only fan project maintained by one person —
there is **no bug bounty**, but you'll be credited in the changelog/release notes
if you'd like.

## Scope & ground rules

In scope: this repository's code and the live site (`rosu-web.vercel.app`) —
e.g. the report pipeline (`/api/report`), admin auth (`/admin`, `/api/admin/*`),
the cron/archive jobs, and the Drive image proxy.

Please:

- **Don't** run DoS/volume tests or spam the live report endpoint (it stores real
  data and is rate-limited; use a local dev setup instead).
- **Don't** access, modify, or delete data that isn't yours — if you stumble into
  someone else's report data, stop and report it.
- Test against a local clone wherever possible (`CONTRIBUTING.md` has setup steps).

Good-faith research that follows these rules is welcome; we won't pursue action
against it.
