// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useEffect, useRef, type ReactNode } from "react";

function IconX() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

/**
 * Accessible modal image viewer, shared by the landing screenshots and the
 * admin table. Behavior contract: Escape closes, backdrop click closes,
 * background scroll locks, focus moves to the close button on open and is
 * restored to the previously-focused element on close, and Tab is trapped
 * inside the dialog while it is open.
 *
 * The parent controls mounting — render <Lightbox …/> only while open.
 */
export default function Lightbox({
  src,
  alt,
  caption,
  onClose,
}: {
  src: string;
  alt: string;
  caption?: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Keep onClose current without re-running the mount effect (which would
  // re-capture the previously-focused element and break focus restoration).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
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
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount only; onClose is read from a ref
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={() => onCloseRef.current()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-6"
    >
      <figure className="relative m-0 max-h-full" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element -- full-res enlargement (public asset or proxied admin image), shown at natural size */}
        <img
          src={src}
          alt={alt}
          className="max-h-[86vh] max-w-[92vw] rounded-xl border border-white/10 object-contain shadow-2xl"
        />
        {caption ? (
          <figcaption className="mt-2 text-center text-xs text-white/70">{caption}</figcaption>
        ) : null}
        <button
          ref={closeRef}
          type="button"
          onClick={() => onCloseRef.current()}
          aria-label="Close"
          className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-fg shadow-card"
        >
          <IconX />
        </button>
      </figure>
    </div>
  );
}
