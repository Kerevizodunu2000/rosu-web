// SPDX-License-Identifier: GPL-3.0-or-later
// Opt-in crash fingerprints from the desktop app. The app sends the exception
// type, a short message and a list of "module:function" frames; the server
// scrubs anything that could identify the user (paths, e-mail addresses),
// computes the fingerprint itself (never trusting a client-supplied one), and
// groups identical crashes so the admin sees "this crash hit N users".
import { createHash } from 'node:crypto'
import { constantTimeEqual } from './crypto'

export const CRASH_LIMITS_INPUT = { excType: 120, message: 300, frames: 40, frame: 160, body: 32 * 1024 } as const

export type CrashInput = { excType: string; message: string; frames: string[]; appVersion: string; os: string }

const s = (v: unknown) => (typeof v === 'string' ? v : '')

/** Replace path-like and e-mail-like substrings: a message must not carry a username. */
export function scrubText(v: string): string {
  return v
    .replace(/[A-Za-z]:[\\/][^\s'"<>|]*/g, '<path>')              // C:\Users\name\...
    .replace(/\\\\[^\s'"<>|]+/g, '<path>')                          // \\server\share\...
    .replace(/(?:~|\/(?:home|Users|root|mnt|media|var|tmp|private))[\\/][^\s'"<>|]*/g, '<path>')
    .replace(/[^\s@<>"']+@[^\s@<>"']+\.[A-Za-z]{2,}/g, '<email>')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
}

/**
 * Keep a frame only in the "module/path.py:function" shape, reduced to the part
 * from the `rosu` package on (or the bare file name for anything else).
 */
export function cleanFrame(raw: string): string | null {
  const v = raw.trim().replace(/\\/g, '/')
  const m = /^(.*?):([A-Za-z_<>][\w<>.]*)$/.exec(v)
  if (!m) return null
  const path = m[1]
  const idx = path.lastIndexOf('/rosu/')
  const mod = path.startsWith('rosu/') ? path : idx >= 0 ? path.slice(idx + 1) : path.split('/').pop() || ''
  if (!/^[\w./-]{1,120}$/.test(mod) || mod.includes('..')) return null
  return `${mod}:${m[2]}`.slice(0, CRASH_LIMITS_INPUT.frame)
}

export function parseCrash(raw: unknown): { ok: true; value: CrashInput & { token: string } } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: 'bad_json' }
  const d = raw as Record<string, unknown>
  const excType = s(d.exc_type).trim()
  if (!/^[A-Za-z_][\w.]{0,119}$/.test(excType)) return { ok: false, error: 'bad_exc_type' }
  if (!Array.isArray(d.frames) || d.frames.length === 0) return { ok: false, error: 'bad_frames' }
  const frames = d.frames.slice(0, CRASH_LIMITS_INPUT.frames)
    .map((f) => cleanFrame(s(f))).filter((f): f is string => f !== null)
  if (!frames.length) return { ok: false, error: 'bad_frames' }
  return {
    ok: true,
    value: {
      excType,
      message: scrubText(s(d.message)).trim().slice(0, CRASH_LIMITS_INPUT.message),
      frames,
      appVersion: s(d.app_version).slice(0, 40),
      os: scrubText(s(d.os)).slice(0, 120),
      token: s(d.token),
    },
  }
}

/** Stable id for "the same crash": exception type + the frame list (no message, no versions). */
export function crashFingerprint(c: Pick<CrashInput, 'excType' | 'frames'>): string {
  return createHash('sha256').update(`${c.excType}\n${c.frames.join('\n')}`).digest('hex').slice(0, 24)
}

export type CrashDeps = {
  appToken: string
  checkRateLimit: () => Promise<{ allowed: boolean; reason?: string }>
  record: (c: CrashInput & { fingerprint: string }) => Promise<void>
}

export async function handleCrash(a: { raw: unknown; userAgent: string; deps: CrashDeps }):
  Promise<{ status: number; body: { ok: boolean; error?: string; fingerprint?: string } }> {
  // Desktop-only endpoint: same shared friction token as /api/report, fail closed.
  if (!/^Rosu\//.test(a.userAgent)) return { status: 403, body: { ok: false, error: 'forbidden' } }
  const parsed = parseCrash(a.raw)
  if (!parsed.ok) return { status: 400, body: { ok: false, error: parsed.error } }
  const { token, ...crash } = parsed.value
  if (!a.deps.appToken || !constantTimeEqual(token, a.deps.appToken)) return { status: 200, body: { ok: false, error: 'unauthorized' } }
  const rl = await a.deps.checkRateLimit()
  if (!rl.allowed) return { status: 429, body: { ok: false, error: rl.reason ?? 'rate_limited' } }
  const fingerprint = crashFingerprint(crash)
  await a.deps.record({ ...crash, fingerprint })
  return { status: 200, body: { ok: true, fingerprint } }
}
