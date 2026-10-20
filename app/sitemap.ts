// SPDX-License-Identifier: GPL-3.0-or-later
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/links";
import { listPosts } from "@/lib/devlog";
import { LOCALES, LOCALE_TAGS, localePath } from "@/lib/i18n";

type Freq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const PAGES: { path: string; changeFrequency: Freq; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/changelog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/docs", changeFrequency: "monthly", priority: 0.7 },
  { path: "/docs/api", changeFrequency: "monthly", priority: 0.4 },
  { path: "/devlog", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/missing-packs", changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/share-card", changeFrequency: "monthly", priority: 0.5 },
  { path: "/tools/wrapped", changeFrequency: "monthly", priority: 0.5 },
  { path: "/report", changeFrequency: "yearly", priority: 0.5 },
  { path: "/status", changeFrequency: "daily", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

/** Every page once per language, each listing all its language versions. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    ...PAGES,
    ...listPosts().map((p) => ({ path: `/devlog/${p.slug}`, changeFrequency: "yearly" as Freq, priority: 0.5, lastModified: p.date })),
  ];
  const out: MetadataRoute.Sitemap = [];
  for (const page of pages) {
    const languages = Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], `${SITE_URL}${localePath(l, page.path)}`]));
    for (const l of LOCALES) {
      const { path, ...rest } = page;
      out.push({ ...rest, url: `${SITE_URL}${localePath(l, path)}`, alternates: { languages } });
    }
  }
  return out;
}
