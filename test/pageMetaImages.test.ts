// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it } from 'vitest'
import { pageMeta } from '@/lib/pageMeta'

describe('pageMeta images', () => {
  it.each(['en', 'tr', 'ja'] as const)('sets OG and Twitter images in %s', (locale) => {
    const m = pageMeta(locale, '/docs', 'Docs', 'd')
    expect(m.openGraph?.images).toContain('/opengraph-image')
    expect(m.twitter?.images).toContain('/twitter-image')
  })
})
