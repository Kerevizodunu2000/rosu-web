// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useState, type ReactNode } from "react";
import Lightbox from "./Lightbox";

function IconZoom() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 20 20" />
      <path d="M10.5 8v5M8 10.5h5" />
    </svg>
  );
}

/**
 * Wraps a (server-rendered) image in a button that opens it full-size in the
 * shared <Lightbox>. Lets the landing page stay a server component — only this
 * thin wrapper is a client component. `src` is the full-resolution image to
 * show enlarged (the same public asset the thumbnail uses).
 */
export default function ZoomableShot({
  src,
  alt,
  label,
  caption,
  className = "",
  children,
}: {
  src: string;
  alt: string;
  label: string;
  caption?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-haspopup="dialog"
        className={`group relative block w-full cursor-zoom-in overflow-hidden ${className}`}
      >
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-fg opacity-0 shadow-card backdrop-blur transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <IconZoom />
        </span>
      </button>
      {open ? (
        <Lightbox src={src} alt={alt} caption={caption} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
