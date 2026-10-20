// SPDX-License-Identifier: GPL-3.0-or-later
// Renders a dictionary string with the two bits of markup the dictionaries use:
// [text](href) for a link and **text** for emphasis. The strings are our own
// (content/i18n), never user input; anything else is shown as plain text.
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { localePath, type Locale } from "@/lib/i18n";

const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
const LINK_CLASS = "text-accent-2 underline underline-offset-2";

export function richNodes(text: string, locale: Locale): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      const href = m[2];
      out.push(href.startsWith("/") && !href.startsWith("//")
        ? <Link key={i++} href={localePath(locale, href)} className={LINK_CLASS}>{m[1]}</Link>
        : href.startsWith("mailto:")
          ? <a key={i++} href={href} className={LINK_CLASS}>{m[1]}</a>
          : <a key={i++} href={href} className={LINK_CLASS} target="_blank" rel="noopener noreferrer">{m[1]}</a>);
    } else {
      out.push(<strong key={i++} className="text-fg">{m[3]}</strong>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Rich({ text, locale }: { text: string; locale: Locale }) {
  return <>{richNodes(text, locale).map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}
