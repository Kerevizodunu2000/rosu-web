// SPDX-License-Identifier: GPL-3.0-or-later
const TOKEN_URI = 'https://oauth2.googleapis.com/token'
const API = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

export type Transport = (
  method: string, url: string,
  init?: { headers?: Record<string, string>; body?: BodyInit },
) => Promise<{ status: number; headers: Headers; bytes: Uint8Array; text: () => string }>

const defaultTransport: Transport = async (method, url, init) => {
  const res = await fetch(url, { method, headers: init?.headers, body: init?.body })
  const buf = new Uint8Array(await res.arrayBuffer())
  return { status: res.status, headers: res.headers, bytes: buf, text: () => new TextDecoder().decode(buf) }
}

const qEscape = (v: string) => v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")

export class DriveClient {
  private access = ''
  private exp = 0
  constructor(
    private cfg: { clientId: string; clientSecret: string; refreshToken: string },
    private transport: Transport = defaultTransport,
  ) {}

  async getAccessToken(now = Date.now()): Promise<string> {
    if (this.access && now < this.exp - 60_000) return this.access
    const form = new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: this.cfg.refreshToken,
      client_id: this.cfg.clientId, client_secret: this.cfg.clientSecret,
    })
    const r = await this.transport('POST', TOKEN_URI, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form,
    })
    const data = JSON.parse(r.text()) as { access_token?: string; expires_in?: number; error?: string }
    if (!data.access_token) throw new Error(`drive token refresh failed: ${data.error ?? 'no token'}`)
    this.access = data.access_token
    this.exp = now + (data.expires_in ?? 3600) * 1000
    return this.access
  }

  private async auth(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await this.getAccessToken()}` }
  }
  private async api(method: string, path: string, init?: { headers?: Record<string,string>; body?: BodyInit }) {
    const r = await this.transport(method, API + path, { ...init, headers: { ...(await this.auth()), ...(init?.headers ?? {}) } })
    if (r.status < 200 || r.status >= 300) throw new Error(`Drive ${method} ${path} -> ${r.status}: ${r.text().slice(0, 200)}`)
    return r
  }

  async ensureFolder(name: string, parent?: string): Promise<string> {
    const parts = [`name = '${qEscape(name)}'`, 'trashed = false', "mimeType = 'application/vnd.google-apps.folder'"]
    if (parent) parts.push(`'${qEscape(parent)}' in parents`)
    const q = new URLSearchParams({ q: parts.join(' and '), fields: 'files(id,name)', pageSize: '10', spaces: 'drive' })
    const found = JSON.parse((await this.api('GET', `/files?${q}`)).text()).files as { id: string }[]
    if (found.length) return found[0].id
    const meta: Record<string, unknown> = { name, mimeType: 'application/vnd.google-apps.folder' }
    if (parent) meta.parents = [parent]
    const created = await this.api('POST', '/files?fields=id', {
      headers: { 'Content-Type': 'application/json; charset=UTF-8' }, body: JSON.stringify(meta),
    })
    return JSON.parse(created.text()).id
  }

  async uploadFile(a: { name: string; mimeType: string; bytes: Uint8Array; parent: string }): Promise<string> {
    const boundary = 'rosuBoundary' + a.name.length + a.bytes.length
    const meta = JSON.stringify({ name: a.name, parents: [a.parent] })
    const enc = new TextEncoder()
    const head = enc.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
      `--${boundary}\r\nContent-Type: ${a.mimeType}\r\n\r\n`)
    const tail = enc.encode(`\r\n--${boundary}--`)
    const body = new Uint8Array(head.length + a.bytes.length + tail.length)
    body.set(head, 0); body.set(a.bytes, head.length); body.set(tail, head.length + a.bytes.length)
    const r = await this.transport('POST', `${UPLOAD}/files?uploadType=multipart&fields=id`, {
      headers: { ...(await this.auth()), 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
    })
    if (r.status < 200 || r.status >= 300) throw new Error(`Drive upload -> ${r.status}: ${r.text().slice(0, 200)}`)
    return JSON.parse(r.text()).id
  }

  async listFolder(parent: string): Promise<{ id: string; name: string; size?: string }[]> {
    const out: { id: string; name: string; size?: string }[] = []
    let pageToken: string | undefined
    do {
      const q = new URLSearchParams({
        q: `'${qEscape(parent)}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id,name,size)', pageSize: '1000', spaces: 'drive',
      })
      if (pageToken) q.set('pageToken', pageToken)
      const p = JSON.parse((await this.api('GET', `/files?${q}`)).text())
      out.push(...(p.files ?? [])); pageToken = p.nextPageToken
    } while (pageToken)
    return out
  }

  async downloadFile(id: string): Promise<Uint8Array> {
    return (await this.api('GET', `/files/${encodeURIComponent(id)}?alt=media`)).bytes
  }
  async deleteFile(id: string): Promise<void> {
    await this.api('DELETE', `/files/${encodeURIComponent(id)}`)
  }
}
