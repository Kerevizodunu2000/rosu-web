// SPDX-License-Identifier: GPL-3.0-or-later
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/links";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      // Private or per-person pages: never worth crawling.
      disallow: ["/api/", "/report/status/"],
    }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
