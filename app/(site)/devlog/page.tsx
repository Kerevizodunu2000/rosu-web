// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { DevlogIndexView } from "@/components/views/DevlogView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/devlog", t.devlog.title, t.devlog.description);

export default function Page() {
  return <DevlogIndexView locale="en" />;
}
