// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Lightbox from "./Lightbox";

export type CarouselShot = {
  src: string;
  alt: string;
  title: string;
  chip: string;
  width: number;
  height: number;
};

const VISIBLE = 3; // card slots (the grid collapses to 1 column on mobile)
const INTERVAL_MS = 4000;

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
 * Auto-rotating window of {VISIBLE} screenshot cards over a larger pool.
 * Every few seconds the window advances by one with a slide-in animation
 * (staggered per card). Rotation pauses on hover/focus and while the lightbox
 * is open, and never starts for users who prefer reduced motion. Clicking a
 * card opens the full-pool Lightbox gallery at that screenshot.
 */
export default function ShotCarousel({ shots }: { shots: CarouselShot[] }) {
  const count = shots.length;
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || lightboxIndex !== null || count <= VISIBLE || reducedMotion.current) return;
    const t = setInterval(() => setOffset((o) => (o + 1) % count), INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, lightboxIndex, count]);

  const galleryImages = shots.map((s) => ({ src: s.src, alt: s.alt, caption: s.title }));

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: Math.min(VISIBLE, count) }, (_, slot) => {
          const idx = (offset + slot) % count;
          const shot = shots[idx];
          return (
            <figure
              key={`${offset}-${slot}`}
              className="card-swap card overflow-hidden"
              style={{ animationDelay: `${slot * 90}ms` }}
            >
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-accent/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/30" />
                <span className="chip ml-3">{shot.chip}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(idx)}
                aria-label={`Enlarge the ${shot.title} screenshot`}
                aria-haspopup="dialog"
                className="group relative block w-full cursor-zoom-in overflow-hidden"
              >
                <Image
                  src={shot.src}
                  width={shot.width}
                  height={shot.height}
                  alt={shot.alt}
                  loading="lazy"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="h-auto max-w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-fg opacity-0 shadow-card backdrop-blur transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <IconZoom />
                </span>
              </button>
              <figcaption className="border-t border-border px-4 py-2.5 text-sm font-medium text-fg">
                {shot.title}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {count > VISIBLE && (
        <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Screenshot pages">
          {shots.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setOffset(i)}
              aria-label={`Show ${s.title} first`}
              aria-current={i === offset}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === offset ? "w-6 bg-accent-2" : "w-2 bg-fg-muted/30 hover:bg-fg-muted/60"
              }`}
            />
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox images={galleryImages} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}
