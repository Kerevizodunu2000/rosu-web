// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import ReportView from "@/components/views/ReportView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/report", t.report.title, t.report.description);

export default function Page() {
  return <ReportView locale="en" />;
}
