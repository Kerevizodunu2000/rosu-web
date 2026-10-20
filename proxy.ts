// SPDX-License-Identifier: GPL-3.0-or-later
import { NextResponse, type NextRequest } from 'next/server'
import { adminSlug, routeAdmin } from '@/lib/adminPath'
import { SESSION_COOKIE, rotateIfDue, sessionCookieOptions } from '@/lib/session'
import { getDb } from '@/lib/db'
import { sessionStore } from '@/lib/adminGuard'

// Rendered by Next's not-found page with a 404 status.
const NOT_FOUND = '/__rosu_not_found'

/**
 * 1. Secret admin path (ADMIN_PATH): map /<slug>[/api/*] onto the real admin
 *    routes and hide /admin + /api/admin/* behind a plain 404.
 * 2. Session rotation: a load of the admin page with a session older than
 *    ROTATE_AFTER_SECONDS swaps in a fresh session id (the old one lapses after
 *    a short grace window, so the render and in-flight requests still pass).
 * Authorization itself is enforced in every admin route, not here.
 */
export async function proxy(req: NextRequest) {
  const route = routeAdmin(req.nextUrl.pathname, adminSlug())
  if (route.kind === 'pass') return NextResponse.next()
  if (route.kind === 'not_found') return NextResponse.rewrite(new URL(NOT_FOUND, req.url))

  const res = route.to === req.nextUrl.pathname
    ? NextResponse.next()
    : NextResponse.rewrite(new URL(route.to + req.nextUrl.search, req.url))

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
  // known at runtime, so the matcher cannot name it.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'],
}
