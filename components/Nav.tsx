// SPDX-License-Identifier: GPL-3.0-or-later
import Link from "next/link";
import Brand from "./Brand";
import { DOWNLOAD_URL } from "@/lib/links";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/changelog", label: "Changelog" },
  { href: "/docs", label: "Docs" },
  { href: "/report", label: "Report a problem" },
] as const;

const LINK_CLASS = "transition-colors hover:text-fg hover:underline decoration-accent-2 underline-offset-4";

/** The one list of primary links, rendered inline on wide screens and as a second row on phones. */
function NavLinks({ className }: { className: string }) {
  return (
    <div className={className}>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={LINK_CLASS}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <nav aria-label="Primary" className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Brand priority />
          <NavLinks className="hidden items-center gap-6 text-sm font-medium text-fg-muted md:flex" />
          <a href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary shrink-0">
            Download
          </a>
        </div>
        <NavLinks className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-border py-2.5 text-sm font-medium text-fg-muted md:hidden" />
      </nav>
    </header>
  );
}
