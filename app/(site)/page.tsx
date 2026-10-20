// SPDX-License-Identifier: GPL-3.0-or-later
import HomeView from "@/components/views/HomeView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

export const metadata = pageMeta("en", "/", null, dict("en").meta.siteDescription);

export default function Home() {
  return <HomeView locale="en" />;
}
