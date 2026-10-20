// SPDX-License-Identifier: GPL-3.0-or-later
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from './i18n'

/** The language of an app/(intl)/[lang] route (404 for anything else). */
export async function routeLocale(params: Promise<{ lang: string }>): Promise<Exclude<Locale, 'en'>> {
  const { lang } = await params
  if (!isLocale(lang) || lang === 'en') notFound()
  return lang
}
