// SPDX-License-Identifier: GPL-3.0-or-later
// Dead-man's switch for the nightly job: ping healthchecks.io (or any
// compatible service) on success and `<url>/fail` on failure. If the cron stops
// running altogether, the missing ping is what raises the alarm.

/** The configured https ping URL, or null when unset/invalid. */
export function pingUrl(raw: string | undefined = process.env.HEALTHCHECKS_PING_URL): string | null {
  const v = (raw ?? '').trim().replace(/\/+$/, '')
  if (!v) return null
  try { return new URL(v).protocol === 'https:' ? v : null } catch { return null }
}

/** Best-effort ping; never throws and never holds the job up for long. */
export async function ping(url: string | null, outcome: 'success' | 'fail', detail = '', fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (!url) return false
  try {
    const res = await fetchImpl(outcome === 'fail' ? `${url}/fail` : url, {
      method: 'POST', body: detail.slice(0, 1000), signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch { return false }
}
