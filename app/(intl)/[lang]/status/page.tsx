// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import StatusView from "@/components/views/StatusView";
import { pageMeta } from "@/lib/pageMeta";
import { routeLocale } from "@/lib/intlParams";
import { dict } from "@/content/i18n";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = dict(locale);
  return pageMeta(locale, "/status", t.status.title, t.status.description);
}

export default async function Page({ params }: Props) {
  const locale = await routeLocale(params);
  return <StatusView locale={locale} />;
}
