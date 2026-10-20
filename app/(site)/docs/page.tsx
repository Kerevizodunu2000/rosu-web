// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { DocsView } from "@/components/views/DocsView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/docs", t.docs.title, t.docs.description);

export default function Page() {
  return <DocsView locale="en" />;
}
