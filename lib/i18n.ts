// SPDX-License-Identifier: GPL-3.0-or-later
// Site languages (v2.0). English lives at the bare paths (/docs); every other
// language under its own prefix (/tr/docs, /ja/docs). Pages are generated
// statically for each language — nothing is negotiated per request, so a link
// always shows the language it names.

export const LOCALES = ['en', 'tr', 'ja'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
/** The languages that live under a path prefix. */
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE) as Exclude<Locale, 'en'>[]

export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', tr: 'Türkçe', ja: '日本語' }
/** BCP 47 tags for Intl formatting and Open Graph. */
export const LOCALE_TAGS: Record<Locale, string> = { en: 'en-GB', tr: 'tr-TR', ja: 'ja-JP' }

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v)

/**
 * The path of ``path`` (an absolute site path, maybe with a #fragment or
 * ?query) in ``locale``: ``/docs`` → ``/tr/docs``, ``/`` → ``/tr``,
 * ``/#features`` → ``/tr#features``. External URLs pass through untouched.
 */
export function localePath(locale: Locale, path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path
  if (locale === DEFAULT_LOCALE) return path
  const cut = path.search(/[?#]/)
  const base = cut === -1 ? path : path.slice(0, cut)
  const rest = cut === -1 ? '' : path.slice(cut)
  return `/${locale}${base === '/' ? '' : base}${rest}`
}

/** Split a site path into its language and the language-free path. */
export function splitLocale(path: string): { locale: Locale; path: string } {
  const m = /^\/([a-z]{2})(?=\/|$|[?#])(.*)$/.exec(path)
  if (m && isLocale(m[1]) && m[1] !== DEFAULT_LOCALE) {
    const rest = m[2] || '/'
    return { locale: m[1], path: rest.startsWith('/') ? rest : `/${rest}` }
  }
  return { locale: DEFAULT_LOCALE, path: path || '/' }
}

/** ``alternates`` for a page's metadata: the canonical URL and every language version. */
export function alternates(locale: Locale, path: string) {
  const languages: Record<string, string> = {}
  for (const l of LOCALES) languages[LOCALE_TAGS[l]] = localePath(l, path)
  languages['x-default'] = path
  return { canonical: localePath(locale, path), languages }
}
