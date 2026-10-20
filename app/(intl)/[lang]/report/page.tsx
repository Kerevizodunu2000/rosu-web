// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import ReportView from "@/components/views/ReportView";
import { pageMeta } from "@/lib/pageMeta";
import { routeLocale } from "@/lib/intlParams";
import { dict } from "@/content/i18n";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await routeLocale(params);
  const t = dict(locale);
  return pageMeta(locale, "/report", t.report.title, t.report.description);
}

export default async function Page({ params }: Props) {
  const locale = await routeLocale(params);
  return <ReportView locale={locale} />;
}
