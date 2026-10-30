// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect, type Page } from '@playwright/test'

const HREFLANGS = ['en-GB', 'tr-TR', 'ja-JP', 'x-default']
const PAGES: [string, string[]][] = [
  ['/', ['/', '/tr', '/ja', '/']],
  ['/tr', ['/', '/tr', '/ja', '/']],
  ['/ja', ['/', '/tr', '/ja', '/']],
  ['/docs', ['/docs', '/tr/docs', '/ja/docs', '/docs']],
]

for (const [path, expected] of PAGES) {
  test(`${path} names all its language versions`, async ({ page }) => {
    await page.goto(path)
    for (const [i, lang] of HREFLANGS.entries()) {
      const link = page.locator(`link[rel="alternate"][hreflang="${lang}"]`)
      await expect(link).toHaveCount(1)
      const href = await link.getAttribute('href')
      expect(new URL(href!).pathname, `${path} ${lang}`).toBe(expected[i])
    }
  })
}

const style = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => {
    const cs = getComputedStyle(el)
    return { wordBreak: cs.wordBreak, ratio: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) }
  })

test('Japanese paragraphs break at phrases with 1.8 leading; headings stay tight', async ({ page }) => {
  await page.goto('/ja')
  for (const sel of ['h1 + p', 'article h3 + p']) {
    const s = await style(page, sel)
    expect(s.wordBreak, sel).toBe('auto-phrase')
    expect(s.ratio, sel).toBeGreaterThan(1.7)
    expect(s.ratio, sel).toBeLessThan(1.9)
  }
  expect((await style(page, 'h1')).ratio).toBeLessThan(1.5)
})

test('Japanese has no synthetic italics, English keeps them', async ({ page }) => {
  const inject = () => page.evaluate(() => {
    const root = document.querySelector('[lang]:not(html)')!
    return ['<em>x</em>', '<span class="italic">x</span>'].map((h) => {
      root.insertAdjacentHTML('beforeend', h)
      return getComputedStyle(root.lastElementChild!).fontStyle
    })
  })
  await page.goto('/ja')
  expect(await inject()).toEqual(['normal', 'normal'])
  await page.goto('/')
  expect(await inject()).toEqual(['italic', 'italic'])
})
