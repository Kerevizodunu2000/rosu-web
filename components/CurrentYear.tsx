// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

/**
 * The current year, read in the visitor's browser. Static pages are rendered at
 * build time, so a server-side `new Date()` froze the footer's year until the
 * next deploy; the client value replaces the build-time one after hydration.
 */
export default function CurrentYear() {
  return <span suppressHydrationWarning>{new Date().getFullYear()}</span>;
}
