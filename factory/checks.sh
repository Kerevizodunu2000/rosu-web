#!/usr/bin/env bash
# The repo's checks. Exit 0 only when the branch is fit to review.
#
# The gate runs this script from the main checkout with the job's worktree as
# the working directory. Fast, deterministic and non-interactive: it never
# rewrites files. Mirrors .github/workflows/ci.yml (lint, test, build) plus
# the owner's hard rules that a script can check. npm audit and the e2e suite
# stay in CI: they need the network or a browser install.
set -euo pipefail
export NEXT_TELEMETRY_DISABLED=1

echo "== install"
npm ci --prefer-offline --no-audit --no-fund --loglevel=error

echo "== owner rules"
# Secrets are never tracked; .env.example holds names only.
if git ls-files | grep -E '(^|/)\.env($|\.(local|development|production|test)(\.local)?$)'; then
  echo "an env file with values is tracked: see the paths above" >&2; exit 1
fi
# New source files carry the SPDX header.
missing=$(git diff --name-only --diff-filter=A origin/main...HEAD -- '*.ts' '*.tsx' '*.mjs' | while read -r f; do
  [ -f "$f" ] && ! head -3 "$f" | grep -q 'SPDX-License-Identifier' && echo "$f"; done || true)
if [ -n "$missing" ]; then
  echo "new source files without an SPDX-License-Identifier header:" >&2; echo "$missing" >&2; exit 1
fi

echo "== typecheck"
npx tsc --noEmit
echo "== lint"
npm run lint --silent
echo "== tests"
npx vitest run
echo "== build"
npm run build --silent
