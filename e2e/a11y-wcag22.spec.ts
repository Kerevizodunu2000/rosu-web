// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// A phone width below the sm and lg breakpoints, so the phone nav row shows.
test.use({ viewport: { width: 360, height: 740 } })

// Copied from smoke.spec.ts (that file is protected and exports nothing).
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
  ['/tools/wrapped', /Wrapped/i],
  ['/tr', /beatmap paketi/i],
  ['/tr/docs', /Rosu kullanımı/i],
  ['/tr/report', /Sorun bildir/i],
  ['/tr/tools/missing-packs', /paket/i],
  ['/tr/privacy', /Gizlilik/i],
  ['/ja', /ビートマップパック/],
  ['/ja/docs', /使い方/],
  ['/ja/report', /問題を報告/],
  ['/ja/tools/wrapped', /Wrapped/],
  ['/ja/terms', /利用規約/],
] as const

for (const [path, heading] of PAGES) {
  test(`${path} has 24px targets and ordered headings`, async ({ page }) => {
    const res = await page.goto(path)
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading)
    await page.evaluate(() => Promise.all(document.getAnimations()
      .filter((a) => a.effect?.getTiming().iterations !== Infinity)
      .map((a) => a.finished.catch(() => undefined))))
    const res2 = await new AxeBuilder({ page }).withRules(['target-size', 'heading-order']).analyze()
    expect(res2.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
  })
}
