// SPDX-License-Identifier: GPL-3.0-or-later
// Opt-in confirmation e-mail after a report, sent through Resend's HTTP API.
// Disabled unless both RESEND_API_KEY and ACK_EMAIL_FROM are set.
//
// The message never echoes anything the reporter typed (title, description):
// the recipient address is unverified, so echoing input would let anyone use
// the form to mail arbitrary text to arbitrary people. It carries only the
// report number and the tracking link.

const RESEND_URL = 'https://api.resend.com/emails'

export type AckConfig = { apiKey: string; from: string }

export function ackConfig(env: Record<string, string | undefined> = process.env): AckConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim()
  const from = env.ACK_EMAIL_FROM?.trim()
  return apiKey && from ? { apiKey, from } : null
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export function buildAckEmail(a: { id: number; statusUrl: string }) {
  const subject = `Rosu — we received your report #${a.id}`
  const text = [
    `Thanks — your report #${a.id} reached the Rosu maintainer.`,
    '',
    'You can follow its status (received → in review → fixed) here:',
    a.statusUrl,
    '',
    'Keep this link private: anyone who has it can see the report\'s title and status.',
    'You received this because you ticked "e-mail me a confirmation" on the Rosu report form.',
    'This is a one-off message — we will not add you to any list.',
  ].join('\n')
  const url = escapeHtml(a.statusUrl)
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1f1b24">
<p>Thanks — your report <strong>#${a.id}</strong> reached the Rosu maintainer.</p>
<p>You can follow its status (received → in review → fixed) here:<br><a href="${url}">${url}</a></p>
<p style="color:#6b6475;font-size:13px">Keep this link private: anyone who has it can see the report's title and status.<br>
You received this because you ticked "e-mail me a confirmation" on the Rosu report form. This is a one-off message — we will not add you to any list.</p>
</body></html>`
  return { subject, text, html }
}

export async function sendAckEmail(
  cfg: AckConfig, to: string, a: { id: number; statusUrl: string },
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const msg = buildAckEmail(a)
  try {
    const res = await fetchImpl(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: cfg.from, to: [to], subject: msg.subject, text: msg.text, html: msg.html }),
      signal: AbortSignal.timeout(8000),
    })
    return res.ok
  } catch { return false }
}
