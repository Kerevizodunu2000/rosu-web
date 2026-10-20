// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { ApiDocsView } from "@/components/views/DocsView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/docs/api", t.docs.apiTitle, t.docs.apiDescription);

export default function Page() {
  return <ApiDocsView locale="en" />;
}
