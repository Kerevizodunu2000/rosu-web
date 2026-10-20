// SPDX-License-Identifier: GPL-3.0-or-later
// Latest desktop release, for the app's "a new version is available" check.
// Backed by the GitHub Releases API and cached at the edge, so thousands of
// app launches cost GitHub a handful of requests per hour.

export const RELEASES_API = 'https://api.github.com/repos/Kerevizodunu2000/rosu/releases/latest'
export const NOTES_MAX = 1500

export type LatestVersion = {
  version: string            // "1.7.1"
  tag: string                // "v1.7.1"
  name: string
  published_at: string | null
  url: string                // release page
  download_url: string | null
  sha256_url: string | null
  notes: string              // first NOTES_MAX chars of the release notes
}

type GhAsset = { name?: unknown; browser_download_url?: unknown }
type GhRelease = {
  tag_name?: unknown; name?: unknown; html_url?: unknown; published_at?: unknown
  body?: unknown; draft?: unknown; prerelease?: unknown; assets?: unknown
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const httpsGithub = (u: string) => /^https:\/\/github\.com\//.test(u)

/** Normalize the GitHub payload; null when it is not a usable published release. */
export function parseLatestRelease(json: unknown): LatestVersion | null {
  if (typeof json !== 'object' || json === null) return null
  const r = json as GhRelease
  if (r.draft === true || r.prerelease === true) return null
  const tag = str(r.tag_name)
  const m = /^v?(\d+\.\d+\.\d+)$/.exec(tag)
  const url = str(r.html_url)
  if (!m || !httpsGithub(url)) return null
  const assets = Array.isArray(r.assets) ? (r.assets as GhAsset[]) : []
  const find = (re: RegExp) => {
    const a = assets.find((x) => re.test(str(x.name)) && httpsGithub(str(x.browser_download_url)))
    return a ? str(a.browser_download_url) : null
  }
  const notes = str(r.body).replace(/\r\n/g, '\n').trim()
  return {
    version: m[1], tag, name: str(r.name) || tag,
    published_at: str(r.published_at) || null,
    url,
    download_url: find(/^rosu-v?\d+\.\d+\.\d+-win64\.exe$/),
    sha256_url: find(/^rosu-v?\d+\.\d+\.\d+-win64\.exe\.sha256$/),
    notes: notes.length > NOTES_MAX ? notes.slice(0, NOTES_MAX).trimEnd() + '…' : notes,
  }
}

export async function fetchLatestRelease(fetchImpl: typeof fetch = fetch, token = process.env.GITHUB_TOKEN): Promise<LatestVersion | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'rosu-web (+https://rosu-web.vercel.app)',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetchImpl(RELEASES_API, { headers, signal: AbortSignal.timeout(8000) })
  if (!res.ok) return null
  return parseLatestRelease(await res.json())
}
