// SPDX-License-Identifier: GPL-3.0-or-later
const URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
export async function verifyTurnstile(
  token: string, secret: string,
  opts: { remoteIp?: string; fetchImpl?: typeof fetch } = {},
): Promise<boolean> {
  if (!token) return false
  const f = opts.fetchImpl ?? fetch
  const form = new URLSearchParams({ secret, response: token })
  if (opts.remoteIp) form.set('remoteip', opts.remoteIp)
  try {
    const res = await f(URL, { method: 'POST', body: form })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch { return false }
}
