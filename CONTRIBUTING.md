# Contributing to rosu-web

Thanks for your interest in improving rosu-web — the website & bug-report backend
for [Rosu](https://github.com/Kerevizodunu2000/rosu). It's a small, solo-maintained,
non-commercial GPL project, so contributions of every size are welcome.

> Found a **bug in the Rosu desktop app** (not the website)? Please report it in the
> [rosu repository](https://github.com/Kerevizodunu2000/rosu/issues) or through the
> in-app "Report a problem" form instead.

## Ways to contribute

- **Report a website bug** — open an [issue](https://github.com/Kerevizodunu2000/rosu-web/issues)
  using the bug template, or use the live [report form](https://rosu-web.vercel.app/report).
- **Suggest a feature** — open an issue with the feature template first, so we can
  discuss it before you invest time in a PR.
- **Send a pull request** — fixes, tests, accessibility, and docs improvements are
  all appreciated.
- **Security issues** — do **not** open a public issue. See [SECURITY.md](./SECURITY.md).

## Development setup

```bash
git clone https://github.com/Kerevizodunu2000/rosu-web.git
cd rosu-web
npm install
cp .env.example .env.local   # env names only — fill in your own values
npm run dev                  # http://localhost:3000
npm run test                 # Vitest (runs without any env configured)
npm run build                # production build (typecheck + lint)
```

Notes:

- The landing, `/privacy`, and `/terms` pages work with **no env vars at all**.
- The report pipeline, admin panel, and archive jobs need real backing services
  (Neon Postgres, a Google OAuth client + refresh token, Cloudflare Turnstile).
  You generally **don't need them** — the service layer is dependency-injected and
  covered by unit tests that run offline.
- Never commit secrets. `.env.local` is gitignored; `.env.example` documents names only.

## Guidelines

- **Match the existing style.** TypeScript strict mode, small focused modules,
  and an `// SPDX-License-Identifier: GPL-3.0-or-later` header on every new source file.
- **Add tests** (Vitest, in `test/`) for new logic — the pure service layer
  (`lib/`) is where most behavior lives and is easy to test via its `deps` objects.
- **Keep PRs small and focused** — one concern per PR, with a clear description.
- **Commit messages**: imperative mood with a conventional prefix
  (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).
- **Accessibility matters** here (focus management, contrast, reduced motion) —
  please don't regress it.

## Pull request process

1. Fork and create a branch from `main`.
2. Make your change; run `npm run test` and `npm run build` — both must pass.
3. Update `CHANGELOG.md` under `[Unreleased]` if the change is user-visible.
4. Open the PR against `main` and fill in the template. The maintainer reviews and
   merges; releases are tagged `vX.Y.Z` by the maintainer.

## License

By contributing, you agree that your contributions will be licensed under the
[GPL-3.0-or-later](./LICENSE), the same license as the project.
