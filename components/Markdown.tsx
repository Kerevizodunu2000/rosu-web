// SPDX-License-Identifier: GPL-3.0-or-later
import { Fragment } from "react";
import { parseMarkdown, type Block, type Inline } from "@/lib/markdown";
import { localePath, type Locale } from "@/lib/i18n";

function Inlines({ nodes, locale }: { nodes: Inline[]; locale: Locale }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.t) {
          case "text":
            return <Fragment key={i}>{n.v}</Fragment>;
          case "code":
            return (
              <code key={i} className="rounded bg-bg px-1.5 py-0.5 font-mono text-[0.85em] text-fg">
                {n.v}
              </code>
            );
          case "strong":
            return <strong key={i} className="font-semibold text-fg"><Inlines nodes={n.c} locale={locale} /></strong>;
          case "em":
            return <em key={i}><Inlines nodes={n.c} locale={locale} /></em>;
          case "link": {
            const external = /^https?:/i.test(n.href);
            // A site path follows the page's language (/privacy → /tr/privacy).
            const href = n.href.startsWith("/") && !n.href.startsWith("//") ? localePath(locale, n.href) : n.href;
            return (
              <a
                key={i}
                href={href}
                className="text-accent-2 underline underline-offset-2"
                {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
              >
                <Inlines nodes={n.c} locale={locale} />
              </a>
            );
          }
        }
      })}
    </>
  );
}

const HEADING = {
  1: "mt-8 text-2xl font-semibold tracking-tight text-fg",
  2: "mt-8 text-xl font-semibold tracking-tight text-fg",
  3: "mt-6 text-base font-semibold text-fg",
  4: "mt-5 text-sm font-semibold uppercase tracking-wide text-fg-muted",
} as const;

function BlockView({ b, locale, headingOffset }: { b: Block; locale: Locale; headingOffset: number }) {
  switch (b.t) {
    case "h": {
      const Tag = (`h${Math.min(Math.max(b.level + headingOffset, 2), 6)}`) as "h2" | "h3" | "h4" | "h5" | "h6";
      return <Tag id={b.id} className={`scroll-mt-24 ${HEADING[b.level]}`}><Inlines nodes={b.c} locale={locale} /></Tag>;
    }
    case "p":
      return <p className="mt-4 leading-relaxed text-fg-muted"><Inlines nodes={b.c} locale={locale} /></p>;
    case "ul":
    case "ol": {
      const Tag = b.t;
      return (
        <Tag className={`mt-4 flex flex-col gap-1.5 pl-5 leading-relaxed text-fg-muted ${b.t === "ul" ? "list-disc" : "list-decimal"}`}>
          {b.items.map((it, i) => <li key={i}><Inlines nodes={it} locale={locale} /></li>)}
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote className="mt-4 border-l-2 border-accent-2/60 pl-4 italic text-fg-muted">
          <Inlines nodes={b.c} locale={locale} />
        </blockquote>
      );
    case "code":
      return (
        // Focusable so keyboard users can scroll a wide block (WCAG scrollable-region-focusable).
        <pre tabIndex={0} className="mt-4 overflow-x-auto rounded-xl border border-border bg-bg p-4 font-mono text-xs leading-relaxed text-fg">
          <code>{b.v}</code>
        </pre>
      );
    case "hr":
      return <hr className="mt-8 border-border" />;
  }
}

/**
 * Renders the safe Markdown subset of lib/markdown.ts. Markdown level n becomes
 * <h(n + headingOffset)>, clamped to h2..h6 (never an <h1>). The default offset 1
 * suits content under a page-level <h2>; pass 0 when the page's <h1> sits directly above.
 */
export default function Markdown({ source, className = "", locale = "en", headingOffset = 1 }: {
  source: string; className?: string; locale?: Locale; headingOffset?: number;
}) {
  const blocks = parseMarkdown(source);
  return (
    <div className={className}>
      {blocks.map((b, i) => <BlockView key={i} b={b} locale={locale} headingOffset={headingOffset} />)}
    </div>
  );
}
