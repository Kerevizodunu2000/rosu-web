// SPDX-License-Identifier: GPL-3.0-or-later
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { DOWNLOAD_URL } from "@/lib/links";

function IconUnpack() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.5 5.2 4h13.6L21 8.5" />
      <rect x="4" y="8.5" width="16" height="11" rx="1.6" />
      <path d="M9 13.2h6" />
    </svg>
  );
}

function IconDedup() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="3.5" width="10" height="10" rx="2.2" />
      <rect x="10.5" y="10.5" width="10" height="10" rx="2.2" />
    </svg>
  );
}

function IconMissing() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="6.2" />
      <path d="M14.6 14.6 20 20" />
      <path d="M10 7.2v3.6" />
      <circle cx="10" cy="13.4" r="0.55" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconImport() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 7.2a1.8 1.8 0 0 1 1.8-1.8h3l1.4 1.8h8a1.8 1.8 0 0 1 1.8 1.8v7.2a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8Z" />
      <path d="M12 9.6v6M9.4 12.8 12 15.4l2.6-2.6" />
    </svg>
  );
}

function IconBackup() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17.5a3.7 3.7 0 0 1-.6-7.35 5.1 5.1 0 0 1 9.85-1.95A3.7 3.7 0 0 1 17 17.5H7Z" />
      <path d="M12 10.6v6M9.6 13 12 10.6 14.4 13" />
    </svg>
  );
}

function IconLocal() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.2 18.5 5.7v5.4c0 4.3-2.8 7.3-6.5 8.7-3.7-1.4-6.5-4.4-6.5-8.7V5.7Z" />
      <path d="M8.9 11.6 11 13.7l4-4" />
    </svg>
  );
}

const features: { title: string; blurb: string; icon: ReactNode }[] = [
  {
    title: "Unpack beatmap packs",
    blurb: "Point Rosu at a downloaded pack and it extracts every beatmapset for you — no manual unzipping.",
    icon: <IconUnpack />,
  },
  {
    title: "Dedup into your Library",
    blurb: "Repeated beatmapsets across packs are merged automatically into one permanent Library. No copies.",
    icon: <IconDedup />,
  },
  {
    title: "Missing-pack detection",
    blurb: "Rosu checks your Library against your packs and tells you exactly what you're still missing.",
    icon: <IconMissing />,
  },
  {
    title: "Import into osu! or lazer",
    blurb: "Send beatmapsets straight into osu!(stable) or osu!lazer — pick the client, Rosu does the rest.",
    icon: <IconImport />,
  },
  {
    title: "Back up to Google Drive",
    blurb: "Archive your Library to your own Google Drive, so a reinstall never means starting from zero.",
    icon: <IconBackup />,
  },
  {
    title: "Local-first, no telemetry",
    blurb: "Everything lives in a local SQLite database on your machine. Rosu doesn't phone home.",
    icon: <IconLocal />,
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-28">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-[3.15rem] lg:leading-[1.08]">
              The tidy home for your{" "}
              <span className="text-gradient-accent">osu! beatmap-pack</span> archives.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">
              Unpack packs, merge duplicates into one Library, and always know what&apos;s
              missing — all running locally on Windows.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Download for Windows
              </a>
              <Link href="/report" className="btn btn-secondary">
                Report a problem
              </Link>
            </div>

            <p className="mt-5 font-mono text-xs uppercase tracking-wide text-fg-muted">
              Free · Open-source (GPL-3.0) · Windows
            </p>
          </div>

          <div className="relative mx-auto h-[300px] w-full max-w-sm sm:h-[360px]" aria-hidden="true">
            <div className="float-idle absolute inset-0">
              <div className="card absolute left-2 top-4 h-32 w-24 -rotate-[12deg] p-3 sm:h-36 sm:w-28">
                <span className="block h-1.5 w-7 rounded-full bg-accent/70" />
                <span className="mt-3 block h-1.5 w-full rounded-full bg-border" />
                <span className="mt-1.5 block h-1.5 w-4/5 rounded-full bg-border" />
                <span className="mt-1.5 block h-1.5 w-3/5 rounded-full bg-border" />
              </div>

              <div className="card absolute bottom-3 right-1 h-36 w-28 rotate-[9deg] p-3 sm:h-40 sm:w-32">
                <span className="block h-1.5 w-7 rounded-full bg-accent-2/70" />
                <span className="mt-3 block h-1.5 w-full rounded-full bg-border" />
                <span className="mt-1.5 block h-1.5 w-3/5 rounded-full bg-border" />
                <span className="mt-1.5 block h-1.5 w-4/5 rounded-full bg-border" />
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/rosu-mark.svg"
                  width={168}
                  height={168}
                  alt=""
                  priority
                  className="drop-shadow-[0_18px_36px_rgba(255,46,151,0.35)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Everything your Library needs.
            </h2>
            <p className="mt-3 text-fg-muted">
              Six jobs Rosu handles so your beatmap packs stop piling up in Downloads.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="card p-6 transition duration-200 ease-out hover:-translate-y-1 hover:border-accent-2/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/12 text-accent-2">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-fg">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{feature.blurb}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Preview — stylized, not a real screenshot (none exist yet) */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              A quiet, tidy Library
            </h2>
            <p className="mt-3 text-fg-muted">
              Real screenshots are coming soon — here&apos;s the idea.
            </p>
          </div>

          <div className="card mx-auto mt-10 max-w-3xl overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
              <span className="chip ml-3">Rosu — Library</span>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-[128px_1fr] sm:p-8">
              <div className="hidden flex-col gap-2 sm:flex">
                <span className="chip justify-start">Library</span>
                <span className="chip justify-start text-fg-muted/70">Missing</span>
                <span className="chip justify-start text-fg-muted/70">Backups</span>
              </div>

              <div className="relative grid grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl border border-border"
                    style={{
                      background: `linear-gradient(160deg, rgba(255,102,170,${0.1 + (i % 4) * 0.05}), rgba(255,46,151,${0.04 + (i % 3) * 0.04}))`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
