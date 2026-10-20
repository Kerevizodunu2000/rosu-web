// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevlogPostView } from "@/components/views/DevlogView";
import { getPost, listPosts } from "@/lib/devlog";
import { pageMeta } from "@/lib/pageMeta";

export const dynamicParams = false;

export function generateStaticParams() {
  return listPosts().map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const meta = pageMeta("en", `/devlog/${post.slug}`, post.title, post.summary);
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: post.date } };
}

export default async function DevlogPost({ params }: Props) {
  const { slug } = await params;
  if (!getPost(slug)) notFound();
  return <DevlogPostView locale="en" slug={slug} />;
}
