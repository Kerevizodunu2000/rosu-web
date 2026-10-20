// SPDX-License-Identifier: GPL-3.0-or-later
import { NextResponse } from 'next/server'
import { fetchLatestRelease } from '@/lib/releases'
export const runtime = 'nodejs'
// Rendered per request (never baked in at build time); the s-maxage header below
// lets Vercel's CDN serve it, so GitHub sees a few requests an hour at most.
export const dynamic = 'force-dynamic'

const CORS = { 'Access-Control-Allow-Origin': '*' }

/** GET → { ok, version, tag, name, published_at, url, download_url, sha256_url, notes } */
export async function GET() {
  try {
    const latest = await fetchLatestRelease()
    if (!latest) {
      return NextResponse.json({ ok: false, error: 'unavailable' },
        { status: 502, headers: { ...CORS, 'Cache-Control': 'public, s-maxage=60' } })
    }
    return NextResponse.json({ ok: true, ...latest }, {
      headers: { ...CORS, 'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=86400' },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'unavailable' },
      { status: 502, headers: { ...CORS, 'Cache-Control': 'public, s-maxage=60' } })
  }
}
