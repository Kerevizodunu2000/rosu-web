// SPDX-License-Identifier: GPL-3.0-or-later
import { POSTS } from '@/content/devlog/posts'

export type Post = { slug: string; title: string; date: string; summary: string; body: string }

/** Every devlog post, newest first. Posts are plain Markdown kept in content/devlog. */
export function listPosts(): Post[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(slug: string): Post | null {
  return POSTS.find((p) => p.slug === slug) ?? null
}
