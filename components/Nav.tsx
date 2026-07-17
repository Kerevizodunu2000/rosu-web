// SPDX-License-Identifier: GPL-3.0-or-later
import Link from "next/link";
import Brand from "./Brand";
import { DOWNLOAD_URL } from "@/lib/links";

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <nav aria-label="Primary" className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Brand />
          <div className="hidden items-center gap-6 text-sm font-medium text-fg-muted sm:flex">
            <Link
              href="/#features"
              className="transition-colors hover:text-fg hover:underline decoration-accent-2 underline-offset-4"
            >
              Features
            </Link>
            <Link
              href="/report"
              className="transition-colors hover:text-fg hover:underline decoration-accent-2 underline-offset-4"
            >
              Report a problem
            </Link>
          </div>
          <a href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary shrink-0">
            Download
          </a>
        </div>
        <div className="flex items-center justify-center gap-6 border-t border-border py-2.5 text-sm font-medium text-fg-muted sm:hidden">
          <Link
            href="/#features"
            className="transition-colors hover:text-fg hover:underline decoration-accent-2 underline-offset-4"
          >
            Features
          </Link>
          <Link
            href="/report"
            className="transition-colors hover:text-fg hover:underline decoration-accent-2 underline-offset-4"
          >
            Report a problem
          </Link>
        </div>
      </nav>
    </header>
  );
}
