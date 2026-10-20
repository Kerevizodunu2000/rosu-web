// SPDX-License-Identifier: GPL-3.0-or-later
import type { NextRequest } from 'next/server'
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for') || ''
  return xff.split(',')[0].trim() || '0.0.0.0'
}

/**
 * The address as a rate-limiting identity. An IPv6 user typically controls a
 * whole /64 and can rotate through it freely, so limits and lockouts key on that
 * prefix; IPv4 (and IPv4-mapped IPv6) keys on the address itself.
 */
export function ipBucket(ip: string): string {
  const v = ip.trim().toLowerCase().replace(/^\[|\]$/g, '').split('%')[0]
  const mapped = /^(?:0*:)*:?ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(v)
  if (mapped) return mapped[1]
  if (!v.includes(':')) return v
  const [head, tail = ''] = v.split('::')
  const h = head ? head.split(':') : []
  const t = v.includes('::') ? (tail ? tail.split(':') : []) : []
  // An embedded IPv4 tail (…:1.2.3.4) occupies two groups.
  const groups = (xs: string[]) => xs.flatMap((x) => (x.includes('.') ? ['0', '0'] : [x]))
  const hh = groups(h), tt = groups(t)
  const full = v.includes('::') ? [...hh, ...Array(Math.max(0, 8 - hh.length - tt.length)).fill('0'), ...tt] : hh
  if (full.length !== 8 || !full.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return v
  return full.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':') + '::/64'
}

/** Rate-limit identity of a request (see {@link ipBucket}). */
export const rateIp = (req: NextRequest) => ipBucket(clientIp(req))
