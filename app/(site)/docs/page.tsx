// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import Link from "next/link";
import Markdown from "@/components/Markdown";
import { GUIDE } from "@/content/docs";

export const metadata: Metadata = {
  title: "Docs — Rosu",
  description: "How to install Rosu and use it: unpack packs, build a deduplicated Library, import into osu!, back up to Google Drive.",
};

export default function DocsPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        Using <span className="text-gradient-accent">Rosu</span>
      </h1>
      <p className="mt-3 text-fg-muted">
        A short guide to the desktop app. Building something that talks to Rosu? See the{" "}
        <Link href="/docs/api" className="text-accent-2 underline underline-offset-2">API reference</Link>.
      </p>
      <Markdown source={GUIDE} className="mt-6" />
    </section>
  );
}
