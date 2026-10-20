// SPDX-License-Identifier: GPL-3.0-or-later
// Optional secret admin path. With ADMIN_PATH set (e.g. "ops-2f9c1d7e4b"), the
// panel and its API answer only under /<slug> and /<slug>/api/*, and the
// well-known /admin + /api/admin/* paths return 404. This is obscurity on top
// of — never instead of — the session checks every admin route still performs.

const SLUG_RE = /^[A-Za-z0-9_-]{12,64}$/

/** The configured slug, or null when unset or malformed (malformed → warn, fall back). */
export function adminSlug(raw: string | undefined = process.env.ADMIN_PATH): string | null {
  const v = (raw ?? '').trim().replace(/^\/+|\/+$/g, '')
  if (!v) return null
  if (!SLUG_RE.test(v) || v.toLowerCase() === 'admin' || v.toLowerCase() === 'api') {
    console.warn('ADMIN_PATH ignored: use 12-64 characters of A-Z a-z 0-9 _ -')
    return null
  }
  return v
}

/** Where the browser should load the panel / call its API. */
export const adminPageBase = (slug: string | null) => (slug ? `/${slug}` : '/admin')
export const adminApiBase = (slug: string | null) => (slug ? `/${slug}/api` : '/api/admin')

export type AdminRoute =
  | { kind: 'pass' }
  | { kind: 'not_found' }
  | { kind: 'rewrite'; to: string; page: boolean }

function normalize(pathname: string): string {
  let p = pathname
  try { p = decodeURIComponent(p) } catch { /* keep raw */ }
  return p.replace(/\/{2,}/g, '/')
}
const under = (p: string, base: string) => p === base || p.startsWith(base + '/')

/** Decide what the proxy does with a request path. Pure, for testing. */
export function routeAdmin(pathname: string, slug: string | null): AdminRoute {
  const p = normalize(pathname)
  if (!slug) return under(p, '/admin') ? { kind: 'rewrite', to: p, page: p === '/admin' } : { kind: 'pass' }
  const lower = p.toLowerCase()
  if (under(lower, '/admin') || under(lower, '/api/admin')) return { kind: 'not_found' }
  if (p === `/${slug}`) return { kind: 'rewrite', to: '/admin', page: true }
  if (p.startsWith(`/${slug}/api/`)) return { kind: 'rewrite', to: '/api/admin/' + p.slice(slug.length + 6), page: false }
  if (p.startsWith(`/${slug}/`)) return { kind: 'not_found' }
  return { kind: 'pass' }
}
