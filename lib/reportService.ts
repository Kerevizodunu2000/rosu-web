// SPDX-License-Identifier: GPL-3.0-or-later
import { parseReport, imageMagicOk, safeImageName, LIMITS } from './validation'
import { hashIp, constantTimeEqual } from './crypto'

export type ReportDeps = {
  salt: string; appToken: string; turnstileSecret: string
  verifyTurnstile: (token: string, secret: string, opts?: { remoteIp?: string }) => Promise<boolean>
  checkRateLimit: (ipHash: string) => Promise<{ allowed: boolean; reason?: string }>
  insertReport: (r: { source: string; title: string; description: string; contact: string; app_version: string; os: string; lang: string; ip_hash: string }) => Promise<{ id: number }>
  setReportImage: (id: number, v: { image_status: string; image_drive_id?: string; image_name?: string; image_mime?: string }) => Promise<void>
  uploadImage: (a: { name: string; mimeType: string; bytes: Uint8Array }) => Promise<string>
}
type Result = { status: number; body: { ok: boolean; id?: number; error?: string } }
const ok = (id: number): Result => ({ status: 200, body: { ok: true, id } })
const fail = (status: number, error: string): Result => ({ status, body: { ok: false, error } })

export async function handleReport(a: { raw: unknown; ip: string; userAgent: string; deps: ReportDeps }): Promise<Result> {
  const { deps } = a
  const parsed = parseReport(a.raw)
  if (!parsed.ok) return parsed.error === 'missing_fields' ? fail(400, 'missing_fields') : fail(400, parsed.error)
  const v = parsed.value
  if (v.hp) return ok(0) // honeypot: look successful, store nothing

  const rawObj = a.raw as Record<string, unknown> | null
  const turnstileToken = typeof rawObj?.turnstileToken === 'string' ? rawObj.turnstileToken : ''
  const isDesktop = /^Rosu\//.test(a.userAgent)
  let source: 'app' | 'web'
  if (turnstileToken) {
    if (!(await deps.verifyTurnstile(turnstileToken, deps.turnstileSecret, { remoteIp: a.ip }))) return fail(200, 'captcha')
    source = 'web'
  } else if (isDesktop) {
    if (!deps.appToken || !constantTimeEqual(v.token, deps.appToken)) return fail(200, 'unauthorized')
    source = 'app'
  } else {
    return fail(200, 'captcha') // browser without a solved captcha
  }

  const ipHash = hashIp(a.ip, deps.salt)
  const rl = await deps.checkRateLimit(ipHash)
  if (!rl.allowed) return fail(429, rl.reason ?? 'rate_limited')

  const { id } = await deps.insertReport({
    source, title: v.title, description: v.description, contact: v.contact,
    app_version: v.appVersion, os: v.os, lang: v.lang, ip_hash: ipHash,
  })

  if (v.image) {
    try {
      const bytes = new Uint8Array(Buffer.from(v.image.b64, 'base64'))
      if (bytes.length > LIMITS.imageBytes || !imageMagicOk(bytes, v.image.mime)) {
        await deps.setReportImage(id, { image_status: 'error' })
      } else {
        const name = safeImageName(v.image.mime, id)
        const driveId = await deps.uploadImage({ name, mimeType: v.image.mime, bytes })
        await deps.setReportImage(id, { image_status: 'stored', image_drive_id: driveId, image_name: name, image_mime: v.image.mime })
      }
    } catch { await deps.setReportImage(id, { image_status: 'error' }) }
  }
  return ok(id)
}
