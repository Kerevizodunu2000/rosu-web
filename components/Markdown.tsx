// SPDX-License-Identifier: GPL-3.0-or-later
import { Fragment } from "react";
import { parseMarkdown, type Block, type Inline } from "@/lib/markdown";

function Inlines({ nodes }: { nodes: Inline[] }) {
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
            return <strong key={i} className="font-semibold text-fg"><Inlines nodes={n.c} /></strong>;
          case "em":
            return <em key={i}><Inlines nodes={n.c} /></em>;
          case "link": {
            const external = /^https?:/i.test(n.href);
            return (
              <a
                key={i}
                href={n.href}
                className="text-accent-2 underline underline-offset-2"
                {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
              >
                <Inlines nodes={n.c} />
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

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "h": {
      const Tag = (`h${Math.min(b.level + 1, 6)}`) as "h2" | "h3" | "h4" | "h5";
      return <Tag id={b.id} className={`scroll-mt-24 ${HEADING[b.level]}`}><Inlines nodes={b.c} /></Tag>;
    }
    case "p":
      return <p className="mt-4 leading-relaxed text-fg-muted"><Inlines nodes={b.c} /></p>;
    case "ul":
    case "ol": {
      const Tag = b.t;
      return (
        <Tag className={`mt-4 flex flex-col gap-1.5 pl-5 leading-relaxed text-fg-muted ${b.t === "ul" ? "list-disc" : "list-decimal"}`}>
          {b.items.map((it, i) => <li key={i}><Inlines nodes={it} /></li>)}
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote className="mt-4 border-l-2 border-accent-2/60 pl-4 italic text-fg-muted">
          <Inlines nodes={b.c} />
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

/** Renders the safe Markdown subset of lib/markdown.ts (headings start at <h2>). */
export default function Markdown({ source, className = "" }: { source: string; className?: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className={className}>
      {blocks.map((b, i) => <BlockView key={i} b={b} />)}
    </div>
  );
}
