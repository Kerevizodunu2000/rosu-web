# CLAUDE.md

Instructions for coding agents (Claude Code, the software factory's agents, and
others) working in this repo. Humans: see `CONTRIBUTING.md`.

## What rosu-web is

The website and small backend for [Rosu](https://github.com/Kerevizodunu2000/rosu),
a free, open-source osu! companion app: https://rosu-web.vercel.app. Next.js 16
(App Router), React 19, Tailwind 4, TypeScript strict, Neon serverless
Postgres, on the Vercel free tier. Docs, changelog, devlog, status, the
bug-report form with status tracking, the admin panel (password + TOTP), web
tools (missing packs, share card, Rosu Wrapped), in English, Turkish and
Japanese. Unofficial fan project; GPL-3.0-or-later.

## Setup (fresh checkout)

```bash
npm ci
cp .env.example .env.local     # names only; the site and tests run without values
```

Dev server on a given port: `npx next dev -p <port>` (default 3000). The
landing, docs, privacy and terms pages work with no env vars. The report
pipeline, admin and archive jobs need real services; unit tests inject their
deps and run offline.

## Validation

`factory/checks.sh` is the source of truth; it runs `npm ci`, then:

```bash
npx tsc --noEmit
npm run lint
npx vitest run
npm run build
```

plus the owner-rule checks below. CI (`.github/workflows/ci.yml`) also runs
`npm audit --omit=dev --audit-level=high` and the Playwright e2e suite
(`npm run e2e`, `e2e/`, with axe accessibility checks).

## Layout

- `app/`: routes. `(site)` English, `(intl)/[lang]` Turkish and Japanese,
  `api/` endpoints, `admin` (hidden path).
- `components/`: UI; `components/views/` page bodies.
- `lib/`: the service layer. Logic lives here with injected `deps`, so it is
  testable offline.
- `content/i18n/`: `en.ts`, `tr.ts`, `ja.ts`. Every user-facing string, in all
  three.
- `app/globals.css`: design tokens (light and dark).
- `db/`: migrations (`npm run migrate`).
- `test/`: Vitest. `e2e/`: Playwright.
- `next.config.ts`: security headers. `proxy.ts`: middleware.

## Owner's rules (binding)

- **Language:** code, comments, commit messages, `CHANGELOG.md` and
  `README.md` are English. The site is trilingual (en, tr, ja).
- **Commits:** authored as the repo's configured git user (the owner), with a
  conventional prefix (`feat:`, `fix:`, `docs:`, `chore:`, `test:`). Never add
  `Co-Authored-By` or other trailers, and never put a model name in a commit,
  PR, comment or file.
- **Code:** small modules in `lib/` with Vitest tests in `test/`; thin pages
  and routes; every new source file starts with
  `// SPDX-License-Identifier: GPL-3.0-or-later`.
- **Tests:** every logic change gets a test.
- **Accessibility:** focus management, contrast, reduced motion; don't regress
  the axe checks.
- **Never commit:** `.env.local` or any env file with values. Secrets live in
  Vercel env vars and GitHub secrets only, never in code or `NEXT_PUBLIC_*`.
- **Privacy:** store the minimum; never store raw IP addresses; keep the
  KVKK/GDPR deletion (`lib/dsar.ts`) and retention (`lib/retention.ts`)
  working.
- **Money:** the project takes no money and spends none. No sales,
  donations, supporter tiers, paywalls, ads, paid services, paid domains or
  paid infrastructure; only free tiers. If a free quota runs out, the feature
  degrades.
- **Security:** the repo is public. Nothing may leak the owner's personal
  data or let anyone use the owner's keys or accounts.
- **Branding:** no ppy osu! logo; "osu!" only describes what Rosu works with.
- **Releases:** each version passes a review gate (Sonnet finders → Opus
  verification → fixes) before it ships. Agents never tag or deploy.
- **Versioning:** user-visible changes go in `CHANGELOG.md` under
  `[Unreleased]`.

## Software factory

`/factory run` builds every open GitHub issue labeled `factory` through
intake → spec → build → gate → review → approve, one PR per issue. State is in
`factory/jobs/` (gitignored); `factory/bin/job` is its only writer. Checks:
`factory/checks.sh`. Dashboard: `cd factory && python3 -m http.server`, then
open http://localhost:8000/dashboard.html. In sessions without the `gh` CLI,
run the scripts with `FACTORY_GITHUB=mcp` (see `.claude/skills/factory/SKILL.md`).
