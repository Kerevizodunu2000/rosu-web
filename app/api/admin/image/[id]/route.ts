// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySession } from '@/lib/session'
import { getSql, listReportById } from '@/lib/db'
import { DriveClient } from '@/lib/drive'
export const runtime = 'nodejs'
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!(await verifySession(token, process.env.ADMIN_SESSION_SECRET!))) return new NextResponse('unauthorized', { status: 401 })
  const { id } = await ctx.params
  const rec = await listReportById(getSql(), Number(id))
  if (!rec || !rec.image_drive_id) return new NextResponse('not found', { status: 404 })
  const drive = new DriveClient({ clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!, clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!, refreshToken: process.env.GOOGLE_REFRESH_TOKEN! })
  const bytes = await drive.downloadFile(rec.image_drive_id)
  return new NextResponse(Buffer.from(bytes), { headers: { 'Content-Type': rec.image_mime || 'image/png', 'Cache-Control': 'private, no-store' } })
}
