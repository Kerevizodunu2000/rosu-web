// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import PrivacyView from "@/components/views/PrivacyView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/privacy", t.legal.privacyTitle, t.legal.privacyIntro);

export default function Page() {
  return <PrivacyView locale="en" />;
}
