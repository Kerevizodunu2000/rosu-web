// SPDX-License-Identifier: GPL-3.0-or-later
import type { Locale } from '@/lib/i18n'
import { en, type Dict } from './en'
import { tr } from './tr'
import { ja } from './ja'

export type { Dict }
const DICTS: Record<Locale, Dict> = { en, tr, ja }

/** The dictionary for ``locale``. */
export const dict = (locale: Locale): Dict => DICTS[locale]

/** ``{name}`` placeholders filled from ``vars`` (unknown ones are left as is). */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}
