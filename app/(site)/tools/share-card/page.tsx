// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import ShareCard from "@/components/ShareCard";

export const metadata: Metadata = {
  title: "Library share card — Rosu",
  description: "Turn your Rosu library export into a shareable image: sets, hours of music, top artists, modes. Made in your browser — nothing uploaded.",
};

export default function ShareCardPage() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        Library <span className="text-gradient-accent">share card</span>
      </h1>
      <p className="mt-3 text-fg-muted">
        In Rosu, open Search, list what you want on the card (an empty search lists everything) and use
        Export… → JSON. Pick that file here: the card is drawn in your browser, and the file never leaves
        your computer.
      </p>
      <div className="mt-8">
        <ShareCard />
      </div>
    </section>
  );
}
