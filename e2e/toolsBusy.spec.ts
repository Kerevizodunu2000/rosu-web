// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from '@playwright/test'

// Choosing a file and then clearing the input before the first read finishes
// used to leave "Reading the export…" on screen forever.
for (const path of ['/tools/share-card', '/tools/wrapped']) {
  test(`${path} clears the busy status when the file is removed mid-read`, async ({ page }) => {
    await page.goto(path)
    const input = page.locator('input[type="file"]')
    await input.evaluate((el: HTMLInputElement) => {
      const pick = (files: File[]) => {
        const dt = new DataTransfer()
        files.forEach((f) => dt.items.add(f))
        el.files = dt.files
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }
      pick([new File(['{}'], 'library.json', { type: 'application/json' })])
      pick([])
    })
    await page.waitForTimeout(500)
    await expect(page.getByText('Reading the export…')).toHaveCount(0)
  })
}
