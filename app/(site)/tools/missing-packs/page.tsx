// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { MissingPacksView } from "@/components/views/ToolsView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/tools/missing-packs", t.tools.missingTitle, t.missing.description);

export default function Page() {
  return <MissingPacksView locale="en" />;
}
