// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/components/Markdown";
import { getPost, listPosts } from "@/lib/devlog";

export const dynamicParams = false;

export function generateStaticParams() {
  return listPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: `${post.title} — Rosu devlog`,
    description: post.summary,
    openGraph: { type: "article", title: post.title, description: post.summary, publishedTime: post.date },
  };
}

export default async function DevlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  return (
    <article className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <Link href="/devlog" className="text-sm text-accent-2 hover:underline underline-offset-4">← Devlog</Link>
      <time dateTime={post.date} className="mt-6 block font-mono text-xs uppercase tracking-wide text-fg-muted">{post.date}</time>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{post.title}</h1>
      <Markdown source={post.body} className="mt-4" />
    </article>
  );
}
