// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse, after } from 'next/server'
import { handleReport } from '@/lib/reportService'
import { verifyTurnstile } from '@/lib/turnstile'
import { checkRateLimit, REPORT_LIMITS, ACK_LIMITS, ACK_RECIPIENT_LIMITS } from '@/lib/ratelimit'
import { runArchiveJob } from '@/lib/archiveJob'
import { getDb, insertReport, setReportImage, recordRateEvent, countEventsSince, countAllEventsSince, countUnarchived } from '@/lib/db'
import { DriveClient } from '@/lib/drive'
import { clientIp, rateIp } from '@/lib/net'
import { hashIp } from '@/lib/crypto'
import { requireEnv } from '@/lib/env'
import { newStatusToken, statusUrl } from '@/lib/reportStatus'
import { ackConfig, sendAckEmail } from '@/lib/email'

export const runtime = 'nodejs'

let _drive: DriveClient | null = null
function getDrive(): DriveClient {
  if (!_drive) {
    _drive = new DriveClient({
      clientId: requireEnv('GOOGLE_OAUTH_CLIENT_ID'), clientSecret: requireEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
      refreshToken: requireEnv('GOOGLE_REFRESH_TOKEN'),
    })
  }
  return _drive
}

export async function POST(req: NextRequest) {
  const MAX_BODY = Math.floor(4.4 * 1024 * 1024)
  const contentLength = Number(req.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY) return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 })

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 }) }

  const rootName = process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'Rosu Reports'
  const ack = ackConfig()

  try {
    const sql = await getDb()
    const result = await handleReport({
      raw, ip: clientIp(req), rateKey: rateIp(req), userAgent: req.headers.get('user-agent') || '',
      deps: {
        salt: requireEnv('IP_HASH_SALT'), appToken: process.env.REPORT_APP_TOKEN || '', turnstileSecret: requireEnv('TURNSTILE_SECRET_KEY'),
        verifyTurnstile,
        checkRateLimit: (ipHash) => checkRateLimit(ipHash, {
          countEventsSince: (ip, since) => countEventsSince(sql, ip, since, 'report'),
          countAllEventsSince: (since) => countAllEventsSince(sql, since, 'report'),
          recordRateEvent: (ip) => recordRateEvent(sql, ip, 'report'),
        }, Date.now(), REPORT_LIMITS),
        insertReport: (r) => insertReport(sql, r),
        setReportImage: (id, v) => setReportImage(sql, id, v),
        uploadImage: async (img) => {
          const drive = getDrive()
          const root = await drive.ensureFolder(rootName)
          const inbox = await drive.ensureFolder('Inbox', root)
          return drive.uploadFile({ ...img, parent: inbox })
        },
        newStatusToken,
        statusUrl: (token, lang) => statusUrl(token, undefined, lang),
        ackEmailEnabled: ack !== null,
        allowAck: async (ipHash, recipient) => {
          const toHash = hashIp('ack-to:' + recipient.trim().toLowerCase(), requireEnv('IP_HASH_SALT'))
          const perRecipient = await checkRateLimit(toHash, {
            countEventsSince: (h, since) => countEventsSince(sql, h, since, 'ack_to'),
            countAllEventsSince: (since) => countAllEventsSince(sql, since, 'ack_to'),
            recordRateEvent: (h) => recordRateEvent(sql, h, 'ack_to'),
          }, Date.now(), ACK_RECIPIENT_LIMITS)
          if (!perRecipient.allowed) return false
          return (await checkRateLimit(ipHash, {
            countEventsSince: (ip, since) => countEventsSince(sql, ip, since, 'ack'),
            countAllEventsSince: (since) => countAllEventsSince(sql, since, 'ack'),
            recordRateEvent: (ip) => recordRateEvent(sql, ip, 'ack'),
          }, Date.now(), ACK_LIMITS)).allowed
        },
      },
    })
    const ackEmail = result.followUp?.ackEmail
    if (ack && ackEmail) {
      after(async () => { await sendAckEmail(ack, ackEmail.to, ackEmail) })
    }
    // Threshold auto-archive: once enough reports pile up, bundle them to Drive
    // right away instead of waiting for the nightly cron (which stays as the
    // backstop). Runs after the response is sent; best-effort — a rare
    // concurrent trigger can only produce a duplicate zip, never lose data.
    if (result.body.ok && result.body.id) {
      after(async () => {
        try {
          const threshold = Number(process.env.AUTO_ARCHIVE_THRESHOLD ?? 25)
          if (Number.isFinite(threshold) && threshold > 0 && (await countUnarchived(sql)) >= threshold) {
            await runArchiveJob()
          }
        } catch { /* nightly cron will pick it up */ }
      })
    }
    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 })
  }
}
