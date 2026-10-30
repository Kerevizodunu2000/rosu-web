// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import nextConfig from '../next.config'

const rules = () => nextConfig.headers!()
const has = (r: { headers: { key: string }[] }, key: string) => r.headers.some((h) => h.key === key)

test('every path gets the seven baseline security headers', async () => {
  const all = (await rules()).find((r) => r.source === '/:path*')
  expect(all?.headers).toEqual([
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
    { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ])
})

test('CORP same-origin on API routes only', async () => {
  const list = await rules()
  expect(list.find((r) => r.source === '/api/:path*')?.headers).toContainEqual({
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  })
  expect(list.filter((r) => has(r, 'Cross-Origin-Resource-Policy')).map((r) => r.source)).toEqual(['/api/:path*'])
})

test('no COEP anywhere (it would block the Turnstile iframe)', async () => {
  expect((await rules()).some((r) => has(r, 'Cross-Origin-Embedder-Policy'))).toBe(false)
})

test('report status pages keep no-referrer', async () => {
  const list = await rules()
  for (const source of ['/report/status/:path*', '/:lang(tr|ja)/report/status/:path*']) {
    expect(list.find((r) => r.source === source)?.headers).toContainEqual({ key: 'Referrer-Policy', value: 'no-referrer' })
  }
})
