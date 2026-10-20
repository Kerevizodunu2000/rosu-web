// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { handleCrash, CRASH_LIMITS_INPUT } from '@/lib/crash'
import { checkRateLimit, CRASH_LIMITS } from '@/lib/ratelimit'
import { getDb, recordCrash, recordRateEvent, countEventsSince, countAllEventsSince } from '@/lib/db'
import { hashIp } from '@/lib/crypto'
import { clientIp } from '@/lib/net'
import { requireEnv } from '@/lib/env'
export const runtime = 'nodejs'

/** Opt-in crash fingerprint from the desktop app (see lib/crash.ts for what is kept). */
export async function POST(req: NextRequest) {
  if (Number(req.headers.get('content-length') || 0) > CRASH_LIMITS_INPUT.body) {
    return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 })
  }
  const text = await req.text().catch(() => '')
  if (text.length > CRASH_LIMITS_INPUT.body) return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 })
  let raw: unknown
  try { raw = JSON.parse(text) } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }) }
  try {
    const sql = await getDb()
    const ipHash = hashIp(clientIp(req), requireEnv('IP_HASH_SALT'))
    const result = await handleCrash({
      raw, userAgent: req.headers.get('user-agent') || '',
      deps: {
        appToken: process.env.REPORT_APP_TOKEN || '',
        checkRateLimit: () => checkRateLimit(ipHash, {
          countEventsSince: (h, since) => countEventsSince(sql, h, since, 'crash'),
          countAllEventsSince: (since) => countAllEventsSince(sql, since, 'crash'),
          recordRateEvent: (h) => recordRateEvent(sql, h, 'crash'),
        }, Date.now(), CRASH_LIMITS),
        record: (c) => recordCrash(sql, {
          fingerprint: c.fingerprint, excType: c.excType, message: c.message, frames: c.frames.join('\n'),
          appVersion: c.appVersion, os: c.os, ipHash,
        }),
      },
    })
    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}
