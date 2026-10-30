// SPDX-License-Identifier: GPL-3.0-or-later
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Markdown from '@/components/Markdown'

const render = (source: string, headingOffset?: number) =>
  renderToStaticMarkup(createElement(Markdown, { source, headingOffset }))

describe('Markdown headingOffset', () => {
  it('defaults to offset 1: ## is h3, ### is h4', () => {
    const html = render('## A\n\n### B')
    expect(html).toContain('<h3')
    expect(html).toContain('<h4')
    expect(html).not.toContain('<h2')
  })

  it('offset 0: ## is h2, ### is h3, # is h2 (never h1)', () => {
    const html = render('## A\n\n### B', 0)
    expect(html).toContain('<h2')
    expect(html).toContain('<h3')
    expect(render('# T', 0)).toContain('<h2')
    expect(render('# T', 0)).not.toContain('<h1')
  })

  it('keeps the same class at both offsets', () => {
    const cls = (html: string) => /<h\d[^>]*class="([^"]*)"/.exec(html)?.[1]
    expect(cls(render('## A', 0))).toBeDefined()
    expect(cls(render('## A', 0))).toBe(cls(render('## A')))
  })
})
