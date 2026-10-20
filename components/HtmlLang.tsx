// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useEffect } from "react";

/** The root layout renders <html lang="en"> for every page (it cannot know the
 *  language of a statically built child); this corrects it on /tr and /ja. The
 *  page's content also carries its own lang attribute from the start. */
export default function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const el = document.documentElement;
    const before = el.lang;
    el.lang = lang;
    return () => { el.lang = before; };
  }, [lang]);
  return null;
}
