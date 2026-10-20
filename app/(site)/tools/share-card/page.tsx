// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { ShareCardView } from "@/components/views/ToolsView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/tools/share-card", t.tools.shareTitle, t.share.description);

export default function Page() {
  return <ShareCardView locale="en" />;
}
