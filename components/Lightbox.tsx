// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

export type LightboxImage = { src: string; alt: string; caption?: ReactNode };

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

function IconX() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}
function IconChevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === "left" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
    </svg>
  );
}

/**
 * Accessible modal image viewer with an optional gallery.
 * - Rendered through a portal to <body> so an ancestor `transform` (e.g. the
 *   hero card's float animation) can't trap the fixed overlay inside it.
 * - Escape / backdrop close; Left/Right arrows navigate; Tab is trapped.
 * - Mouse wheel zooms the current image (1×–4×); drag pans while zoomed.
 * - Focus moves to the close button on open and is restored on close.
 * The parent controls mounting — render <Lightbox …/> only while open.
 */
export default function Lightbox({
  images,
  startIndex = 0,
  onClose,
}: {
  images: LightboxImage[];
  startIndex?: number;
  onClose: () => void;
}) {
  const count = images.length;
  const hasGallery = count > 1;

  const [index, setIndex] = useState(startIndex);
  const [dir, setDir] = useState(0); // -1 prev, 1 next, 0 initial open
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const current = images[index];

  const resetZoom = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);
  const go = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      resetZoom();
      setDir(delta);
      setIndex((i) => (i + delta + count) % count);
    },
    [count, resetZoom]
  );

  // Mount-only: lock background scroll, focus the close button, and restore both
  // on unmount. Kept separate from the key handler so it never re-captures focus.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Keyboard: Escape closes, arrows navigate, Tab stays trapped in the dialog.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !root.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [go]);

  // Wheel-to-zoom. Attached natively with { passive: false } so preventDefault
  // actually suppresses the (locked) page scroll and the gesture zooms instead.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      setScale((s) => {
        const next = clampScale(s * Math.exp(-e.deltaY * 0.0015));
        if (next <= MIN_SCALE) setPan({ x: 0, y: 0 });
        return next;
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: ReactPointerEvent<HTMLImageElement>) {
    if (scale <= 1) return;
    dragRef.current = { x: e.clientX, y: e.clientY, ox: pan.x, oy: pan.y };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: ReactPointerEvent<HTMLImageElement>) {
    const d = dragRef.current;
    if (!d) return;
    setPan({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
  }
  function endDrag() {
    dragRef.current = null;
    setDragging(false);
  }

  const figureAnim = dir === 1 ? "lb-from-right" : dir === -1 ? "lb-from-left" : "lb-open";

  const overlay = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={current.alt}
      onClick={() => onCloseRef.current()}
      className="lb-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 sm:p-6"
    >
      {hasGallery && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-fg shadow-card backdrop-blur transition-colors hover:bg-surface sm:left-4"
        >
          <IconChevron dir="left" />
        </button>
      )}

      <figure
        key={index}
        onClick={(e) => e.stopPropagation()}
        className={`${figureAnim} relative m-0 flex max-h-full max-w-full flex-col items-center`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- full-res enlargement (public asset or proxied admin image), zoom/pan handled here */}
        <img
          src={current.src}
          alt={current.alt}
          draggable={false}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={resetZoom}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 120ms ease-out",
            cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
            touchAction: "none",
          }}
          className="max-h-[84vh] max-w-[92vw] select-none rounded-xl border border-white/10 object-contain shadow-2xl"
        />
        {current.caption ? (
          <figcaption className="mt-3 text-center text-sm text-white/75">{current.caption}</figcaption>
        ) : null}
      </figure>

      {hasGallery && (
        <button
          type="button"
          aria-label="Next image"
          onClick={(e) => { e.stopPropagation(); go(1); }}
          className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-fg shadow-card backdrop-blur transition-colors hover:bg-surface sm:right-4"
        >
          <IconChevron dir="right" />
        </button>
      )}

      <button
        ref={closeRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); onCloseRef.current(); }}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface/85 text-fg shadow-card backdrop-blur transition-colors hover:bg-surface"
      >
        <IconX />
      </button>

      {hasGallery && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 font-mono text-xs text-white/80">
          {index + 1} / {count}
        </div>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
}
