// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { ShareCardView } from "@/components/views/ToolsView";
import { pageMeta } from "@/lib/pageMeta";
import { routeLocale } from "@/lib/intlParams";
import { dict } from "@/content/i18n";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = dict(locale);
  return pageMeta(locale, "/tools/share-card", t.tools.shareTitle, t.share.description);
}

export default async function Page({ params }: Props) {
  const locale = await routeLocale(params);
  return <ShareCardView locale={locale} />;
}
