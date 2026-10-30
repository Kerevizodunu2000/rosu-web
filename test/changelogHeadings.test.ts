// SPDX-License-Identifier: GPL-3.0-or-later
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/releases', () => ({
  fetchReleases: async () => [
    {
      tag: 'v1.2.1',
      name: 'v1.2.1',
      body: '## Highlights\n\nText\n\n### Added\n\n- a\n\n### Fixed\n\n- b',
      published_at: '2026-01-01T00:00:00Z',
      url: 'https://example.com/r',
      download_url: null,
    },
    { tag: 'v1.2.0', name: 'v1.2.0', body: '# Title\n\n### Added\n\n- c', published_at: null, url: 'https://example.com/r2', download_url: null },
  ],
}))

import ChangelogView from '@/components/views/ChangelogView'

describe('ChangelogView heading order', () => {
  it('never skips a level or goes above the release h2', async () => {
    const html = renderToStaticMarkup(await ChangelogView({ locale: 'en' }))
    const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]))
    expect(levels[0]).toBe(1)
    expect(levels).not.toContain(4)
    let prev = 0
    for (const l of levels) {
      expect(l - prev).toBeLessThanOrEqual(1)
      prev = l
    }
    // release bodies: ### is h3 under the release h2, and a body # / ## never exceeds h2
    expect(html).toMatch(/<h3[^>]*>Added/)
    expect(levels.filter((l) => l === 1)).toHaveLength(1)
  })
})
