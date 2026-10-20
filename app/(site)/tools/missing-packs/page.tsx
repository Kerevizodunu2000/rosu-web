// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import MissingPacks from "@/components/MissingPacks";

export const metadata: Metadata = {
  title: "Missing pack checker — Rosu",
  description: "Drop your osu! beatmap pack files and see which standard packs (S, SM, ST, SC) you're missing — in your browser, nothing uploaded.",
};

export default function MissingPacksPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        Missing <span className="text-gradient-accent">pack</span> checker
      </h1>
      <p className="mt-3 text-fg-muted">
        osu!&apos;s standard packs are numbered without gaps, so any number missing between your lowest and
        highest pack is one you don&apos;t have. Drop the pack archives (or just paste their names) and get
        the list, with links to each pack page. The desktop app does this for you automatically.
      </p>
      <div className="mt-8">
        <MissingPacks />
      </div>
    </section>
  );
}
