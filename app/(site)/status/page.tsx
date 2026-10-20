// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import StatusView from "@/components/views/StatusView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

export const dynamic = "force-dynamic";
const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/status", t.status.title, t.status.description);

export default function Page() {
  return <StatusView locale="en" />;
}
