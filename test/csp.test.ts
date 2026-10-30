// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { cspRoute, cspNonce, buildCsp, buildCspReportOnly } from '@/lib/csp'

test('policy: every directive, the nonce in script-src, no reporting endpoint', () => {
  const p = buildCsp('abc123', { dev: false })
  const dirs = p.split('; ')
  expect(dirs[0]).toBe("script-src 'nonce-abc123' 'strict-dynamic' https://challenges.cloudflare.com")
  expect(dirs).toContain("object-src 'none'")
  expect(dirs).toContain("base-uri 'none'")
  expect(dirs).toContain("frame-ancestors 'none'")
  expect(dirs).toContain("form-action 'self'")
  expect(dirs).toHaveLength(5)
  for (const d of ['default-src', 'frame-src', 'style-src', 'report-uri', 'report-to']) expect(p).not.toContain(d)
})

test("'unsafe-eval' only in dev", () => {
  expect(buildCsp('n', { dev: false })).not.toContain("'unsafe-eval'")
  expect(buildCsp('n', { dev: true }).split('; ')[0])
    .toBe("script-src 'nonce-n' 'strict-dynamic' https://challenges.cloudflare.com 'unsafe-eval'")
})

test('nonce: fresh per call, at least 16 bytes of base64', () => {
  const a = cspNonce()
  const b = cspNonce()
  expect(a).not.toBe(b)
  for (const n of [a, b]) {
    expect(n).toMatch(/^[A-Za-z0-9+/]+=*$/)
    expect(Buffer.from(n, 'base64').length).toBeGreaterThanOrEqual(16)
  }
})

test('report-only: Trusted Types', () => {
  expect(buildCspReportOnly()).toBe("require-trusted-types-for 'script'")
})

test('routes: the report form and status pages in every locale, nothing else', () => {
  for (const p of ['/report', '/tr/report', '/ja/report', '/report/status/abc', '/tr/report/status/abc', '/ja/report/status/abc'])
    expect(cspRoute(p), p).toBe(true)
  for (const p of ['/reporting', '/report-x', '/docs/report', '/en/report', '/xx/report', '/api/report', '/', '/status', '/report/status', '/report/status/a/b'])
    expect(cspRoute(p), p).toBe(false)
})
