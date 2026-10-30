// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/** No serious or critical WCAG 2 A/AA violations on the page as rendered. */
async function expectAccessible(page: Page) {
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter((a) => a.effect?.getTiming().iterations !== Infinity)
    .map((a) => a.finished.catch(() => undefined))))
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

test('hero screenshot opens an accessible viewer and Escape returns focus', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Enlarge the Rosu dashboard screenshot' })
  // The hero card floats forever, so Playwright never sees it as stable.
  await trigger.click({ force: true })
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close' })).toBeFocused()
  await expectAccessible(page)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('carousel screenshot opens a viewer that Escape closes', async ({ page }) => {
  await page.goto('/')
  await page.locator('#screenshots').getByRole('button', { name: /^Enlarge the .+ screenshot$/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
