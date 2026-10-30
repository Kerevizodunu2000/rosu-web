// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_NAMES, localePath, splitLocale, type Locale } from "@/lib/i18n";

/** The same page in every language (the page you are on stays put). */
export default function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const { path } = splitLocale(usePathname() || "/");
  return (
    <nav aria-label={label} className="flex items-center gap-1 text-xs font-medium">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={localePath(l, path)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          className={`inline-flex min-h-6 items-center rounded-full px-2 py-1 transition-colors ${
            l === locale ? "bg-accent/15 text-fg" : "text-fg-muted hover:text-fg"
          }`}
        >
          {LOCALE_NAMES[l]}
        </Link>
      ))}
    </nav>
  );
}
