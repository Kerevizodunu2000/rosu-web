// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DevlogPostView } from "@/components/views/DevlogView";
import { getPost, listPosts } from "@/lib/devlog";
import { pageMeta } from "@/lib/pageMeta";
import { routeLocale } from "@/lib/intlParams";

export const dynamicParams = false;

export function generateStaticParams() {
  return listPosts().map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await routeLocale(params);
  const post = getPost((await params).slug);
  if (!post) return {};
  const meta = pageMeta(locale, `/devlog/${post.slug}`, post.title, post.summary);
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: post.date } };
}

export default async function DevlogPost({ params }: Props) {
  const locale = await routeLocale(params);
  const { slug } = await params;
  if (!getPost(slug)) notFound();
  return <DevlogPostView locale={locale} slug={slug} />;
}
