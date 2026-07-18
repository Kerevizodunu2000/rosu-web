// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/links";

/**
 * The contact e-mail as a mailto link that ALSO copies the address to the
 * clipboard on click — so it works whether or not the visitor has a mail app
 * set up. Shows a brief "Copied!" confirmation.
 */
export default function CopyEmail({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard?.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Clipboard blocked (permissions/insecure context) — the mailto still fires. */
    }
  }

  return (
    <span className="relative inline-flex items-center">
      <a href={`mailto:${CONTACT_EMAIL}`} onClick={handleClick} className={className}>
        {CONTACT_EMAIL}
      </a>
      <span
        role="status"
        aria-live="polite"
        className={`pointer-events-none absolute -top-6 left-0 whitespace-nowrap rounded-md bg-fg px-2 py-0.5 text-xs font-medium text-bg transition-opacity duration-200 ${
          copied ? "opacity-100" : "opacity-0"
        }`}
      >
        {copied ? "Copied!" : ""}
      </span>
    </span>
  );
}
