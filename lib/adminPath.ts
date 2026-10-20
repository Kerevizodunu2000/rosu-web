// SPDX-License-Identifier: GPL-3.0-or-later
// Optional secret admin path. With ADMIN_PATH set (e.g. "ops-2f9c1d7e4b"), the
// panel and its API answer only under /<slug> and /<slug>/api/*, and the
// well-known /admin + /api/admin/* paths return 404. This is obscurity on top
// of — never instead of — the session checks every admin route still performs.

const SLUG_RE = /^[A-Za-z0-9_-]{12,64}$/

/** Header the proxy sets on requests it routed to the admin; see {@link gateOk}. */
export const GATE_HEADER = 'x-rosu-admin-gate'

export type AdminPathState =
  | { mode: 'open' }                     // ADMIN_PATH unset: plain /admin
  | { mode: 'secret'; slug: string }     // panel lives at /<slug>
  | { mode: 'locked' }                   // ADMIN_PATH set but invalid: no admin at all

/**
 * A malformed ADMIN_PATH fails CLOSED (the panel disappears) rather than open
 * (falling back to the public /admin): a typo must never re-expose the panel.
 */
export function adminPathState(raw: string | undefined = process.env.ADMIN_PATH): AdminPathState {
  const v = (raw ?? '').trim().replace(/^\/+|\/+$/g, '')
  if (!v) return { mode: 'open' }
  if (!SLUG_RE.test(v) || ['admin', 'api'].includes(v.toLowerCase())) {
    console.error('ADMIN_PATH is invalid (use 12-64 chars of A-Z a-z 0-9 _ -): the admin panel is disabled')
    return { mode: 'locked' }
  }
  return { mode: 'secret', slug: v }
}

/** The configured slug (secret mode) or null. */
export function adminSlug(raw?: string): string | null {
  const s = adminPathState(raw)
  return s.mode === 'secret' ? s.slug : null
}

/** Where the browser should load the panel / call its API. */
export const adminPageBase = (slug: string | null) => (slug ? `/${slug}` : '/admin')
export const adminApiBase = (slug: string | null) => (slug ? `/${slug}/api` : '/api/admin')

export type AdminRoute =
  | { kind: 'pass' }
  | { kind: 'not_found' }
  /** An admin request: rewrite to ``to`` (or serve as-is when null). */
  | { kind: 'admin'; to: string | null; page: boolean }

function decode(pathname: string): string {
  try { return decodeURIComponent(pathname) } catch { return pathname }
}
const under = (p: string, base: string) => p === base || p.startsWith(base + '/')

/** Decide what the proxy does with a request path. Pure, for testing. */
export function routeAdmin(pathname: string, state: AdminPathState): AdminRoute {
  const p = decode(pathname).replace(/\/{2,}/g, '/')
  const lower = p.toLowerCase()
  const isAdminish = under(lower, '/admin') || under(lower, '/api/admin')
  if (state.mode === 'open') {
    // Never rewrite to a decoded path: serve the request exactly as it came.
    return isAdminish ? { kind: 'admin', to: null, page: pathname === '/admin' } : { kind: 'pass' }
  }
  if (state.mode === 'locked') return isAdminish ? { kind: 'not_found' } : { kind: 'pass' }
  const { slug } = state
  if (isAdminish) return { kind: 'not_found' }
  if (!under(p, `/${slug}`)) return { kind: 'pass' }
  // Anything that could walk out of the slug (dot segments, a second layer of
  // encoding) is refused outright instead of being resolved.
  if (p.includes('..') || p.includes('%') || p.includes('\\')) return { kind: 'not_found' }
  if (p === `/${slug}`) return { kind: 'admin', to: '/admin', page: true }
  const rest = p.slice(slug.length + 1)
  if (/^\/api\/[A-Za-z0-9_/-]+$/.test(rest)) return { kind: 'admin', to: '/api/admin' + rest.slice(4), page: false }
  return { kind: 'not_found' }
}

/**
 * In secret mode an admin route must have come through the proxy's rewrite,
 * which stamps {@link GATE_HEADER} with the slug. A request that reached the
 * route some other way (e.g. a path the proxy matcher skips) carries no gate
 * and is answered as if the route did not exist.
 */
export function gateOk(headerValue: string | null, state: AdminPathState = adminPathState()): boolean {
  if (state.mode === 'open') return true
  if (state.mode === 'locked') return false
  return headerValue === state.slug
}
