// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useState, type ReactNode } from "react";
import Lightbox, { type LightboxImage } from "./Lightbox";

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
 * Wraps a (server-rendered) image in a button that opens the shared <Lightbox>.
 * Lets the landing page stay a server component — only this thin wrapper is a
 * client component. Pass the whole `images` gallery and this image's `index` so
 * the enlarged view can page left/right through the set.
 */
export default function ZoomableShot({
  images,
  index = 0,
  label,
  className = "",
  children,
}: {
  images: LightboxImage[];
  index?: number;
  label: string;
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
      {open ? <Lightbox images={images} startIndex={index} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
