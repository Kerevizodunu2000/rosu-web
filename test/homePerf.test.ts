// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import HomeView from '@/components/views/HomeView'
import nextConfig from '@/next.config'

const HERO_SIZES =
  '(min-width: 1152px) 475px, (min-width: 1024px) calc((100vw - 120px) * 0.46), (min-width: 488px) 448px, calc(100vw - 40px)'
const SHOT_SIZES =
  '(min-width: 1152px) 347px, (min-width: 1024px) calc((100vw - 112px) / 3), (min-width: 640px) calc((100vw - 88px) / 2), calc(100vw - 40px)'

const html = renderToStaticMarkup(createElement(HomeView, { locale: 'tr' }))
const imgs = (html.match(/<img\b[^>]*>/g) ?? []).filter((t) => t.includes('screenshots'))
const hero = imgs.filter((t) => t.includes('dashboard.png'))
const shots = imgs.filter((t) => !t.includes('dashboard.png'))

test('hero image: high fetch priority, eager, accurate sizes', () => {
  expect(hero).toHaveLength(1)
  expect(hero[0].toLowerCase()).toContain('fetchpriority="high"')
  expect(hero[0]).not.toContain('loading="lazy"')
  expect(hero[0]).toContain(`sizes="${HERO_SIZES}"`)
})

test('carousel images: lazy, accurate sizes', () => {
  expect(shots.length).toBeGreaterThan(0)
  for (const t of shots) {
    expect(t).toContain('loading="lazy"')
    expect(t).toContain(`sizes="${SHOT_SIZES}"`)
  }
})

test('next/image serves AVIF then WebP', () => {
  expect(nextConfig.images?.formats).toEqual(['image/avif', 'image/webp'])
})
