// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { connection } from "next/server";
import ReportView from "@/components/views/ReportView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/report", t.report.title, t.report.description);

export default async function Page() {
  await connection(); // per-request render, so the CSP nonce reaches Next's scripts
  return <ReportView locale="en" />;
}
