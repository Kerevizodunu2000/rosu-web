// SPDX-License-Identifier: GPL-3.0-or-later
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { parseMarkdown } from '@/lib/markdown'

vi.mock('@/lib/releases', () => ({
  fetchReleases: async () => [
    {
      tag: 'v1.2.1', name: 'v1.2.1', body: '## Highlights\n\nText\n\n### Added\n\n- a\n\n### Fixed\n\n- b',
      published_at: '2026-01-01T00:00:00Z', url: 'https://example.com/r', download_url: null,
    },
    {
      tag: 'v1.2.0', name: 'v1.2.0', body: '## Highlights\n\n### Added\n\n- c\n\n### Fixed\n\n- d\n\n### Main',
      published_at: null, url: 'https://example.com/r2', download_url: null,
    },
  ],
}))

import ChangelogView from '@/components/views/ChangelogView'

const ids = (src: string) => parseMarkdown(src).flatMap((b) => (b.t === 'h' ? [b.id] : []))

describe('heading ids', () => {
  it('numbers repeated headings within one parse', () => {
    expect(ids('# Added\n# Added\n# Added')).toEqual(['added', 'added-2', 'added-3'])
  })
  it('treats main as taken', () => {
    expect(ids('# Main')).toEqual(['main-2'])
  })
  it('never lets a generated suffix collide with another heading', () => {
    expect(ids('# Added\n# Added 2\n# Added\n# Main')).toEqual(['added', 'added-2', 'added-3', 'main-2'])
  })
  it('renders a changelog with unique ids and no id="main"', async () => {
    const html = renderToStaticMarkup(await ChangelogView({ locale: 'en' }))
    const all = [...html.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1])
    expect(all.length).toBeGreaterThan(4)
    expect(new Set(all).size).toBe(all.length)
    expect(all).not.toContain('main')
  })
})
