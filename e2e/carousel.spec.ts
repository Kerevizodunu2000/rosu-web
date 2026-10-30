// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect, type Page } from '@playwright/test'

const firstCaption = (page: Page) => page.locator('#screenshots figcaption').first().innerText()
const release = async (page: Page) => {
  await page.mouse.move(0, 0)
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
}

test('pause button stays paused after hover and focus leave, until play', async ({ page }) => {
  test.setTimeout(40_000)
  await page.goto('/')
  const shots = page.locator('#screenshots')
  const pause = shots.getByRole('button', { name: 'Pause the slideshow' })
  const box = await pause.boundingBox()
  expect(box!.width).toBeGreaterThanOrEqual(24)
  expect(box!.height).toBeGreaterThanOrEqual(24)

  await pause.click()
  const play = shots.getByRole('button', { name: 'Play the slideshow' })
  await expect(play).toBeVisible()
  await release(page)
  const before = await firstCaption(page)
  await page.waitForTimeout(5000)
  expect(await firstCaption(page)).toBe(before)

  await play.click()
  await release(page)
  await expect.poll(() => firstCaption(page), { timeout: 10_000 }).not.toBe(before)
})

test('localised pause labels', async ({ page }) => {
  await page.goto('/tr')
  await expect(page.locator('#screenshots').getByRole('button', { name: 'Slayt gösterisini duraklat' })).toBeVisible()
  await page.goto('/ja')
  await expect(page.locator('#screenshots').getByRole('button', { name: 'スライドショーを一時停止' })).toBeVisible()
})

test('reduced motion turned on live removes the button and stops rotation', async ({ page }) => {
  await page.goto('/')
  const pause = page.locator('#screenshots').getByRole('button', { name: 'Pause the slideshow' })
  await expect(pause).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(pause).toHaveCount(0)
  await release(page)
  const before = await firstCaption(page)
  await page.waitForTimeout(5000)
  expect(await firstCaption(page)).toBe(before)
})
