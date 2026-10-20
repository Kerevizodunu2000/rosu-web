// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from 'next'
import { alternates, LOCALE_TAGS, type Locale } from './i18n'
import { dict } from '@/content/i18n'

/** A page's metadata in ``locale``: "<title> — Rosu", its description, the
 *  canonical URL and every language version (hreflang), and Open Graph. */
export function pageMeta(locale: Locale, path: string, title: string | null, description: string,
  extra: Metadata = {}): Metadata {
  const t = dict(locale)
  const full = title === null ? t.meta.siteTitle : `${title} ${t.meta.titleSuffix}`
  return {
    title: full,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      type: 'website', siteName: 'Rosu', title: full, description,
      url: alternates(locale, path).canonical, locale: LOCALE_TAGS[locale].replace('-', '_'),
    },
    twitter: { card: 'summary_large_image', title: full, description },
    ...extra,
  }
}
