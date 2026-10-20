// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { WrappedView } from "@/components/views/ToolsView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/tools/wrapped", t.tools.wrappedTitle, t.wrapped.description);

export default function Page() {
  return <WrappedView locale="en" />;
}
