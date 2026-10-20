// SPDX-License-Identifier: GPL-3.0-or-later
import { notFound } from "next/navigation";
import SiteChrome from "@/components/SiteChrome";
import { isLocale, PREFIXED_LOCALES } from "@/lib/i18n";

// Every page of the site, once per prefixed language (/tr/…, /ja/…), built
// ahead of time. Any other first segment is not a language: 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return PREFIXED_LOCALES.map((lang) => ({ lang }));
}

export default async function IntlLayout({ children, params }: {
  children: React.ReactNode; params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang) || lang === "en") notFound();
  return <SiteChrome locale={lang}>{children}</SiteChrome>;
}
