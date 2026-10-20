// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminGuard'
import { listReportById } from '@/lib/db'
import { DriveClient } from '@/lib/drive'
import { requireEnv } from '@/lib/env'
export const runtime = 'nodejs'
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin
  const { id } = await ctx.params
  const idNum = Number(id)
  if (!Number.isSafeInteger(idNum) || idNum <= 0) return new NextResponse('not found', { status: 404 })
  const rec = await listReportById(admin.sql, idNum)
  if (!rec || !rec.image_drive_id) return new NextResponse('not found', { status: 404 })
  try {
    const drive = new DriveClient({
      clientId: requireEnv('GOOGLE_OAUTH_CLIENT_ID'), clientSecret: requireEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
      refreshToken: requireEnv('GOOGLE_REFRESH_TOKEN'),
    })
    const bytes = await drive.downloadFile(rec.image_drive_id)
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': rec.image_mime || 'image/png',
        'Cache-Control': 'private, no-store',
        // The bytes are user-supplied: never let a browser treat them as anything but this image.
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    })
  } catch {
    return new NextResponse('image unavailable', { status: 404 })
  }
}
