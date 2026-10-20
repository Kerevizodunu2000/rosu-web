// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import ChangelogView from "@/components/views/ChangelogView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

// Rebuilt at most hourly from GitHub Releases.
export const revalidate = 3600;
const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/changelog", t.changelog.title, t.changelog.description);

export default function Page() {
  return <ChangelogView locale="en" />;
}
