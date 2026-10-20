// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import HomeView from "@/components/views/HomeView";
import { pageMeta } from "@/lib/pageMeta";
import { routeLocale } from "@/lib/intlParams";
import { dict } from "@/content/i18n";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await routeLocale(params);
  return pageMeta(locale, "/", null, dict(locale).meta.siteDescription);
}

export default async function Home({ params }: Props) {
  return <HomeView locale={await routeLocale(params)} />;
}
