// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import ReportStatusView from "@/components/views/ReportStatusView";
import { dict } from "@/content/i18n";

export const metadata: Metadata = {
  title: `${dict("en").reportStatus.title} — Rosu`,
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ReportStatusPage({ params }: { params: Promise<{ token: string }> }) {
  return <ReportStatusView locale="en" token={(await params).token} />;
}
