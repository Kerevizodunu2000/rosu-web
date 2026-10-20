// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { E2E_ADMIN_PATH } from '../playwright.config'

/** No serious or critical WCAG 2 A/AA violations on the page as rendered. */
async function expectAccessible(page: Page) {
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

const PAGES = [
  ['/', /beatmap-pack/i],
  ['/report', /Report a problem/i],
  ['/docs', /Using Rosu/i],
  ['/docs/api', /API reference/i],
  ['/devlog', /Devlog/i],
  ['/devlog/zero-budget-bug-report-pipeline', /zero-budget/i],
  ['/changelog', /Changelog/i],
  ['/status', /Status/i],
  ['/privacy', /Privacy/i],
  ['/terms', /Terms/i],
  ['/tools', /Tools/i],
  ['/tools/missing-packs', /pack/i],
  ['/tools/share-card', /share card/i],
] as const

for (const [path, heading] of PAGES) {
  test(`${path} renders and is accessible`, async ({ page }) => {
    const res = await page.goto(path)
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading)
    await expectAccessible(page)
  })
}

test('report form: honeypot hidden, submit gated, failure explains the fallback', async ({ page }) => {
  await page.goto('/report')
  const send = page.getByRole('button', { name: /send report/i })
  await expect(send).toBeDisabled()
  // The honeypot is visually hidden (sr-only, 1px) and out of the tab order.
  const hp = page.locator('#hp')
  await expect(hp).toHaveAttribute('tabindex', '-1')
  const box = await hp.locator('xpath=..').boundingBox()   // the sr-only wrapper clips it
  expect(box?.width ?? 0).toBeLessThanOrEqual(1)
  await page.getByLabel('Title').fill('E2E title')
  await page.getByLabel('What happened?').fill('E2E description')
  await expect(send).toBeEnabled()
  await send.click()
  // No backend in this run: the form must say so and offer the e-mail fallback.
  await expect(page.getByRole('alert').filter({ hasText: /rosu\.app@gmail\.com/ })).toBeVisible()
})

test('secret admin path: /admin is a 404, the slug serves the sign-in', async ({ page, request }) => {
  expect((await request.get('/admin')).status()).toBe(404)
  expect((await request.post('/api/admin/login', { data: {} })).status()).toBe(404)
  await page.goto(`/${E2E_ADMIN_PATH}`)
  await expect(page.getByRole('heading', { name: /admin sign-in/i })).toBeVisible()
  await expectAccessible(page)
})

test('robots, sitemap and the social card are served', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain('Disallow: /admin')
  expect(await (await request.get('/sitemap.xml')).text()).toContain('/devlog/zero-budget-bug-report-pipeline')
  const og = await request.get('/opengraph-image')
  expect(og.status()).toBe(200)
  expect(og.headers()['content-type']).toContain('image/png')
})

test('health endpoint reports the database honestly', async ({ request }) => {
  const res = await request.get('/api/health')
  expect([200, 503]).toContain(res.status())
  expect(await res.json()).toHaveProperty('db')
})

test('missing pack checker lists interior gaps from pasted names', async ({ page }) => {
  await page.goto('/tools/missing-packs')
  await page.getByText('…or paste a list of names').click()
  await page.getByLabel('Pack file names, one per line').fill('S1 - a.zip\nS4 - b.zip\nSM7 - c.zip')
  await page.getByRole('button', { name: 'Check the list' }).click()
  await expect(page.getByRole('link', { name: 'S2' })).toHaveAttribute('href', 'https://osu.ppy.sh/beatmaps/packs/S2')
  await expect(page.getByRole('link', { name: 'S3' })).toBeVisible()
  await expectAccessible(page)
})

test('share card draws from a Rosu JSON export', async ({ page }) => {
  await page.goto('/tools/share-card')
  const json = JSON.stringify({ sets: [{ artist: 'Camellia', modes: ['osu!mania'], stars: [6.5], keys: [7], length_seconds: 200 }] })
  await page.getByLabel('Rosu export (JSON)').setInputFiles({ name: 'export.json', mimeType: 'application/json', buffer: Buffer.from(json) })
  await expect(page.getByRole('img', { name: /1 beatmap sets/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download PNG' })).toBeEnabled()
  await expectAccessible(page)
})
