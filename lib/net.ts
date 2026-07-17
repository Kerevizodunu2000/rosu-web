// SPDX-License-Identifier: GPL-3.0-or-later
import type { NextRequest } from 'next/server'
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for') || ''
  return xff.split(',')[0].trim() || '0.0.0.0'
}
