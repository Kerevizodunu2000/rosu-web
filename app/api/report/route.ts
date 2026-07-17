// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { handleReport } from '@/lib/reportService'
import { verifyTurnstile } from '@/lib/turnstile'
import { checkRateLimit } from '@/lib/ratelimit'
import { getSql, insertReport, setReportImage, recordRateEvent, countEventsSince, countAllEventsSince } from '@/lib/db'
import { DriveClient } from '@/lib/drive'
import { clientIp } from '@/lib/net'

export const runtime = 'nodejs'

let _drive: DriveClient | null = null
function getDrive(): DriveClient {
  if (!_drive) {
    _drive = new DriveClient({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!, clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
    })
  }
  return _drive
}

export async function POST(req: NextRequest) {
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }) }

  const sql = getSql()
  const rootName = process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'Rosu Reports'

  try {
    const result = await handleReport({
      raw, ip: clientIp(req), userAgent: req.headers.get('user-agent') || '',
      deps: {
        salt: process.env.IP_HASH_SALT!, appToken: process.env.REPORT_APP_TOKEN || '', turnstileSecret: process.env.TURNSTILE_SECRET_KEY!,
        verifyTurnstile,
        checkRateLimit: (ipHash) => checkRateLimit(ipHash, {
          countEventsSince: (ip, since) => countEventsSince(sql, ip, since),
          countAllEventsSince: (since) => countAllEventsSince(sql, since),
          recordRateEvent: (ip) => recordRateEvent(sql, ip),
        }),
        insertReport: (r) => insertReport(sql, r),
        setReportImage: (id, v) => setReportImage(sql, id, v),
        uploadImage: async (img) => {
          const drive = getDrive()
          const root = await drive.ensureFolder(rootName)
          const inbox = await drive.ensureFolder('Inbox', root)
          return drive.uploadFile({ ...img, parent: inbox })
        },
      },
    })
    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}
