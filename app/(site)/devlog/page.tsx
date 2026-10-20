// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import Link from "next/link";
import { listPosts } from "@/lib/devlog";

export const metadata: Metadata = {
  title: "Devlog — Rosu",
  description: "Notes from building Rosu: how features are made, what went wrong, and what is next.",
};

export default function DevlogIndex() {
  const posts = listPosts();
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        Dev<span className="text-gradient-accent">log</span>
      </h1>
      <p className="mt-3 text-fg-muted">Notes from building Rosu — how things are made and why.</p>
      <ul className="mt-10 flex flex-col gap-5">
        {posts.map((p) => (
          <li key={p.slug} className="card p-6 sm:p-7">
            <time dateTime={p.date} className="font-mono text-xs uppercase tracking-wide text-fg-muted">{p.date}</time>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-fg">
              <Link href={`/devlog/${p.slug}`} className="hover:underline underline-offset-4">{p.title}</Link>
            </h2>
            <p className="mt-2 leading-relaxed text-fg-muted">{p.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
