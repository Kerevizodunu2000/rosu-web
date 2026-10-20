// SPDX-License-Identifier: GPL-3.0-or-later
import Link from "next/link";
import Markdown from "@/components/Markdown";
import Rich from "@/components/Rich";
import { API, GUIDES } from "@/content/docs";
import { localePath, type Locale } from "@/lib/i18n";
import { dict } from "@/content/i18n";

export function DocsView({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const [before, after] = t.docs.heading.split("{accent}");
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        {before}<span className="text-gradient-accent">Rosu</span>{after}
      </h1>
      <p className="mt-3 text-fg-muted"><Rich text={t.docs.intro} locale={locale} /></p>
      <Markdown source={GUIDES[locale]} locale={locale} className="mt-6" />
    </section>
  );
}

export function ApiDocsView({ locale }: { locale: Locale }) {
  const t = dict(locale);
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <Link href={localePath(locale, "/docs")} className="text-sm text-accent-2 hover:underline underline-offset-4">{t.docs.back}</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        <span className="text-gradient-accent">{t.docs.apiTitle}</span>
      </h1>
      {locale !== "en" && <p className="mt-3 text-sm text-fg-muted">{t.common.englishOnly}</p>}
      <div lang="en"><Markdown source={API} locale={locale} className="mt-4" /></div>
    </section>
  );
}
