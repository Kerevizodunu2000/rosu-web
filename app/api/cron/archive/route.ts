// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from 'next/server'
import { runArchive } from '@/lib/archiveService'
import { DriveClient } from '@/lib/drive'
import { getSql, listUnarchived, markArchived } from '@/lib/db'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const key = new URL(req.url).searchParams.get('key')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && key !== process.env.CRON_SECRET)
    return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({ ok: true, ...(await archiveNow()) })
}

export async function archiveNow() {
  const sql = getSql()
  const drive = new DriveClient({
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!, clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
  })
  const rootName = process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'Rosu Reports'
  const d = new Date()
  const today = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
  return runArchive({
    listUnarchived: () => listUnarchived(sql),
    downloadImage: (id) => drive.downloadFile(id),
    uploadArchive: async (name, bytes) => {
      const root = await drive.ensureFolder(rootName)
      const archives = await drive.ensureFolder('Archives', root)
      return drive.uploadFile({ name, mimeType: 'application/zip', bytes, parent: archives })
    },
    markArchived: (ids, ref) => markArchived(sql, ids, ref),
    deleteImage: (id) => drive.deleteFile(id),
  }, today)
}
