// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import Link from "next/link";
import Markdown from "@/components/Markdown";
import { API } from "@/content/docs";

export const metadata: Metadata = {
  title: "API reference — Rosu",
  description: "The public endpoints the Rosu desktop app uses: bug reports, crash fingerprints, the update check and health.",
};

export default function ApiDocsPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <Link href="/docs" className="text-sm text-accent-2 hover:underline underline-offset-4">← Docs</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        API <span className="text-gradient-accent">reference</span>
      </h1>
      <Markdown source={API} className="mt-4" />
    </section>
  );
}
