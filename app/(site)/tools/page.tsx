// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tools — Rosu",
  description: "Free in-browser tools for osu! players: find missing beatmap packs, make a library share card. Nothing is uploaded.",
};

const TOOLS = [
  { href: "/tools/missing-packs", title: "Missing pack checker",
    text: "Drop your beatmap pack files and see which S / SM / ST / SC packs you don't have yet." },
  { href: "/tools/share-card", title: "Library share card",
    text: "Turn a Rosu library export into an image with your sets, hours of music and top artists." },
] as const;

export default function ToolsPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        <span className="text-gradient-accent">Tools</span>
      </h1>
      <p className="mt-3 text-fg-muted">Small, free helpers that run entirely in your browser — nothing is uploaded.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link href={tool.href} className="card flex h-full flex-col gap-2 px-5 py-5 transition-transform hover:-translate-y-0.5">
              <span className="text-base font-semibold text-fg">{tool.title}</span>
              <span className="text-sm text-fg-muted">{tool.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
