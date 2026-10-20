// SPDX-License-Identifier: GPL-3.0-or-later
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/links";
import { listPosts } from "@/lib/devlog";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/changelog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/docs`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/docs/api`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/devlog`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/report`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/status`, changeFrequency: "daily", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
  for (const p of listPosts()) {
    pages.push({ url: `${SITE_URL}/devlog/${p.slug}`, lastModified: p.date, changeFrequency: "yearly", priority: 0.5 });
  }
  return pages;
}
