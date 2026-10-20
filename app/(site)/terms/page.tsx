// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import TermsView from "@/components/views/TermsView";
import { pageMeta } from "@/lib/pageMeta";
import { dict } from "@/content/i18n";

const t = dict("en");
export const metadata: Metadata = pageMeta("en", "/terms", t.legal.termsTitle, t.legal.termsIntro);

export default function Page() {
  return <TermsView locale="en" />;
}
