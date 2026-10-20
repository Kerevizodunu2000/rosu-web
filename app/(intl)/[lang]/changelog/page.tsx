// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import ChangelogView from "@/components/views/ChangelogView";
import { pageMeta } from "@/lib/pageMeta";
import { routeLocale } from "@/lib/intlParams";
import { dict } from "@/content/i18n";

// Rebuilt at most hourly from GitHub Releases.
export const revalidate = 3600;
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = dict(locale);
  return pageMeta(locale, "/changelog", t.changelog.title, t.changelog.description);
}

export default async function Page({ params }: Props) {
  const locale = await routeLocale(params);
  return <ChangelogView locale={locale} />;
}
