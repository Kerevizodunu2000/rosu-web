// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { parseLatestRelease, fetchLatestRelease, latestReleaseCached, _resetReleaseMemo, MEMO_TTL_MS, NOTES_MAX } from '@/lib/releases'

const gh = {
  tag_name: 'v1.7.1', name: 'Rosu v1.7.1 — Prune', html_url: 'https://github.com/Kerevizodunu2000/rosu/releases/tag/v1.7.1',
  published_at: '2026-07-27T10:00:00Z', draft: false, prerelease: false, body: '### Added\r\n- Prune',
  assets: [
    { name: 'rosu-v1.7.1-win64.exe', browser_download_url: 'https://github.com/Kerevizodunu2000/rosu/releases/download/v1.7.1/rosu-v1.7.1-win64.exe' },
    { name: 'rosu-v1.7.1-win64.exe.sha256', browser_download_url: 'https://github.com/Kerevizodunu2000/rosu/releases/download/v1.7.1/rosu-v1.7.1-win64.exe.sha256' },
  ],
}

test('normalizes a GitHub release', () => {
  expect(parseLatestRelease(gh)).toEqual({
    version: '1.7.1', tag: 'v1.7.1', name: 'Rosu v1.7.1 — Prune', published_at: '2026-07-27T10:00:00Z',
    url: gh.html_url, download_url: gh.assets[0].browser_download_url, sha256_url: gh.assets[1].browser_download_url,
    notes: '### Added\n- Prune',
  })
})

test('rejects drafts, pre-releases, odd tags and non-GitHub links', () => {
  expect(parseLatestRelease({ ...gh, draft: true })).toBeNull()
  expect(parseLatestRelease({ ...gh, prerelease: true })).toBeNull()
  expect(parseLatestRelease({ ...gh, tag_name: 'latest' })).toBeNull()
  expect(parseLatestRelease({ ...gh, html_url: 'https://evil.example/x' })).toBeNull()
  expect(parseLatestRelease(null)).toBeNull()
  const odd = parseLatestRelease({ ...gh, assets: [{ name: 'rosu-v1.7.1-win64.exe', browser_download_url: 'https://evil.example/x.exe' }] })
  expect(odd?.download_url).toBeNull()
})

test('long notes are clipped', () => {
  const r = parseLatestRelease({ ...gh, body: 'x'.repeat(NOTES_MAX + 50) })
  expect(r?.notes.length).toBe(NOTES_MAX + 1)
  expect(r?.notes.endsWith('…')).toBe(true)
})

test('fetchLatestRelease: upstream failure → null', async () => {
  const fail = (async () => new Response('nope', { status: 403 })) as typeof fetch
  expect(await fetchLatestRelease(fail, '')).toBeNull()
  const ok = (async () => new Response(JSON.stringify(gh), { status: 200 })) as typeof fetch
  expect((await fetchLatestRelease(ok, ''))?.version).toBe('1.7.1')
})

test('latestReleaseCached hits upstream at most once per TTL and keeps the last good value', async () => {
  _resetReleaseMemo()
  let calls = 0
  const good = parseLatestRelease(gh)!
  const fetcher = async () => { calls++; return calls === 3 ? null : good }
  const t = 1_000_000
  expect(await latestReleaseCached(fetcher, t)).toEqual(good)
  expect(await latestReleaseCached(fetcher, t + 1000)).toEqual(good)
  expect(calls).toBe(1)
  expect(await latestReleaseCached(fetcher, t + MEMO_TTL_MS + 1)).toEqual(good)   // refreshed
  expect(calls).toBe(2)
  expect(await latestReleaseCached(fetcher, t + 2 * MEMO_TTL_MS + 2)).toEqual(good) // upstream failed: stale is fine
  expect(calls).toBe(3)
  _resetReleaseMemo()
})
