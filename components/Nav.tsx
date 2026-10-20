// SPDX-License-Identifier: GPL-3.0-or-later
import Link from "next/link";
import Brand from "./Brand";
import LanguageSwitcher from "./LanguageSwitcher";
import { DOWNLOAD_URL } from "@/lib/links";
import { localePath, type Locale } from "@/lib/i18n";
import { dict } from "@/content/i18n";

const LINK_CLASS = "transition-colors hover:text-fg hover:underline decoration-accent-2 underline-offset-4";

/** The one list of primary links, rendered inline on wide screens and as a second row on phones. */
function NavLinks({ locale, className }: { locale: Locale; className: string }) {
  const t = dict(locale).nav;
  const links = [
    { href: "/#features", label: t.features },
    { href: "/changelog", label: t.changelog },
    { href: "/docs", label: t.docs },
    { href: "/tools", label: t.tools },
    { href: "/report", label: t.report },
  ];
  return (
    <div className={className}>
      {links.map((l) => (
        <Link key={l.href} href={localePath(locale, l.href)} className={LINK_CLASS}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export default function Nav({ locale }: { locale: Locale }) {
  const t = dict(locale);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <nav aria-label={t.nav.label} className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Brand priority href={localePath(locale, "/")} label={t.common.homeLabel} />
          <NavLinks locale={locale} className="hidden items-center gap-6 text-sm font-medium text-fg-muted lg:flex" />
          <div className="flex shrink-0 items-center gap-3">
            <LanguageSwitcher locale={locale} label={t.common.language} />
            <a href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary hidden shrink-0 sm:inline-flex">
              {t.common.download}
            </a>
          </div>
        </div>
        <NavLinks locale={locale} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-border py-2.5 text-sm font-medium text-fg-muted lg:hidden" />
      </nav>
    </header>
  );
}
