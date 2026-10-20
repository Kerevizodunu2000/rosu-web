// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import ReportStatusView from "@/components/views/ReportStatusView";
import { routeLocale } from "@/lib/intlParams";
import { dict } from "@/content/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string; token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await routeLocale(params);
  return { title: `${dict(locale).reportStatus.title} — Rosu`, robots: { index: false, follow: false } };
}

export default async function ReportStatusPage({ params }: Props) {
  const locale = await routeLocale(params);
  return <ReportStatusView locale={locale} token={(await params).token} />;
}
