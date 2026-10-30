// SPDX-License-Identifier: GPL-3.0-or-later
// Strict per-request CSP for the dynamic report and admin pages. proxy.ts sets
// it on the request (Next stamps the nonce on its own scripts from there) and
// on the response, replacing the static `frame-ancestors` header from
// next.config.ts. Static pages cannot carry a per-request nonce, so they keep
// only that header.
import { PREFIXED_LOCALES } from './i18n'

function decode(segment: string): string {
  try { return decodeURIComponent(segment) } catch { return segment }
}

/**
 * True for /report and /report/status/<token>, bare or under a prefixed locale.
 * Next decodes dynamic segments before routing (/%74r/report serves /tr/report),
 * so match per decoded segment; an encoded `/` stays inside its segment.
 */
export function cspRoute(pathname: string): boolean {
  const p = pathname.split('/').map(decode)
  if (p[0] !== '') return false
  const rest = (PREFIXED_LOCALES as readonly string[]).includes(p[1]) ? p.slice(2) : p.slice(1)
  return rest[0] === 'report' && (rest.length === 1 || (rest.length === 3 && rest[1] === 'status' && rest[2] !== ''))
}

/** 16 random bytes, base64. */
export function cspNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
}

export function buildCsp(nonce: string, opts: { dev: boolean }): string {
  // 'strict-dynamic' trusts scripts the nonced loader adds (next/script, Turnstile);
  // the host is only a fallback for browsers without it. Dev needs eval for HMR.
  const script = `script-src 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${opts.dev ? " 'unsafe-eval'" : ''}`
  return [script, "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'self'"].join('; ')
}

/** Trusted Types, report-only until the console is clean. */
export function buildCspReportOnly(): string {
  return "require-trusted-types-for 'script'"
}
