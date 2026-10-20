// SPDX-License-Identifier: GPL-3.0-or-later
import Link from "next/link";
import MissingPacks from "@/components/MissingPacks";
import ShareCard from "@/components/ShareCard";
import Wrapped from "@/components/Wrapped";
import AccentHeading from "@/components/AccentHeading";
import { localePath, type Locale } from "@/lib/i18n";
import { dict } from "@/content/i18n";

export function ToolsView({ locale }: { locale: Locale }) {
  const t = dict(locale).tools;
  const tools = [
    { href: "/tools/missing-packs", title: t.missingTitle, text: t.missingCard },
    { href: "/tools/share-card", title: t.shareTitle, text: t.shareCard },
    { href: "/tools/wrapped", title: t.wrappedTitle, text: t.wrappedCard },
  ];
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        <span className="text-gradient-accent">{t.title}</span>
      </h1>
      <p className="mt-3 text-fg-muted">{t.intro}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link href={localePath(locale, tool.href)} className="card flex h-full flex-col gap-2 px-5 py-5 transition-transform hover:-translate-y-0.5">
              <span className="text-base font-semibold text-fg">{tool.title}</span>
              <span className="text-sm text-fg-muted">{tool.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MissingPacksView({ locale }: { locale: Locale }) {
  const t = dict(locale).missing;
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <AccentHeading template={t.heading} accent={t.accent} />
      <p className="mt-3 text-fg-muted">{t.intro}</p>
      <div className="mt-8">
        <MissingPacks t={t} />
      </div>
    </section>
  );
}

export function ShareCardView({ locale }: { locale: Locale }) {
  const t = dict(locale).share;
  return (
    <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <AccentHeading template={t.heading} accent={t.accent} />
      <p className="mt-3 text-fg-muted">{t.intro}</p>
      <div className="mt-8">
        <ShareCard t={t} locale={locale} />
      </div>
    </section>
  );
}

export function WrappedView({ locale }: { locale: Locale }) {
  const t = dict(locale);
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
      <AccentHeading template={t.wrapped.heading} accent={t.wrapped.accent} />
      <p className="mt-3 max-w-3xl text-fg-muted">{t.wrapped.intro}</p>
      <div className="mt-8">
        <Wrapped t={{ wrapped: t.wrapped, share: t.share }} locale={locale} />
      </div>
    </section>
  );
}
