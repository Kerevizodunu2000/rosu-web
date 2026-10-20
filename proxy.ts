// SPDX-License-Identifier: GPL-3.0-or-later
import { NextResponse, type NextRequest } from 'next/server'
import { adminPathState, routeAdmin, GATE_HEADER } from '@/lib/adminPath'
import { SESSION_COOKIE, rotateIfDue, sessionCookieOptions } from '@/lib/session'
import { getDb } from '@/lib/db'
import { sessionStore } from '@/lib/adminGuard'

// Rendered by Next's not-found page with a 404 status.
const NOT_FOUND = '/__rosu_not_found'

/**
 * 1. Secret admin path (ADMIN_PATH): map /<slug>[/api/*] onto the real admin
 *    routes, stamp the request with the gate header, and hide /admin +
 *    /api/admin/* behind a plain 404.
 * 2. Session rotation: a load of the admin page with a session older than
 *    ROTATE_AFTER_SECONDS swaps in a fresh session id (the old one lapses after
 *    a short grace window, so the render and in-flight requests still pass).
 * Authorization itself is enforced in every admin route, not here.
 */
export async function proxy(req: NextRequest) {
  const state = adminPathState()
  const route = routeAdmin(req.nextUrl.pathname, state)
  if (route.kind === 'pass') {
    if (!req.headers.has(GATE_HEADER)) return NextResponse.next()
    const headers = new Headers(req.headers)   // a client never sets the gate itself
    headers.delete(GATE_HEADER)
    return NextResponse.next({ request: { headers } })
  }
  if (route.kind === 'not_found') return NextResponse.rewrite(new URL(NOT_FOUND, req.url))

  const headers = new Headers(req.headers)
  headers.delete(GATE_HEADER)
  if (state.mode === 'secret') headers.set(GATE_HEADER, state.slug)
  const res = route.to === null
    ? NextResponse.next({ request: { headers } })
    : NextResponse.rewrite(new URL(route.to + req.nextUrl.search, req.url), { request: { headers } })

  const token = req.cookies.get(SESSION_COOKIE)?.value
  const secret = process.env.ADMIN_SESSION_SECRET || ''
  if (route.page && req.method === 'GET' && token && secret) {
    try {
      const rotated = await rotateIfDue(sessionStore(await getDb()), token, secret)
      if (rotated) res.cookies.set(SESSION_COOKIE, rotated.token, sessionCookieOptions(rotated.maxAge))
    } catch { /* rotation is best-effort; the page still verifies the current session */ }
  }
  return res
}

export const config = {
  // Everything except build output and static images: the secret slug is only
  // known at runtime, so the matcher cannot name it. Admin routes reached via a
  // skipped path carry no gate header and answer 404 (lib/adminPath.ts gateOk).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'],
}
