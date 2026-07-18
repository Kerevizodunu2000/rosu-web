// SPDX-License-Identifier: GPL-3.0-or-later
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import ZoomableShot from "@/components/ZoomableShot";
import { DOWNLOAD_URL } from "@/lib/links";

const DASHBOARD_ALT =
  "Rosu dashboard showing 497 unpacked beatmaps in Output, with Unpack Archives, Import to osu!lazer or osu!(stable), and Back up to Drive actions above the beatmap list";

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

const screenshots: {
  title: string;
  chip: string;
  src: string;
  width: number;
  height: number;
  alt: string;
}[] = [
  {
    title: "Packs",
    chip: "Rosu — Packs",
    src: "/screenshots/packs.png",
    width: 1906,
    height: 918,
    alt: "Rosu Packs tab: a table of beatmap packs with category, series, code, title, and track columns",
  },
  {
    title: "Search",
    chip: "Rosu — Search",
    src: "/screenshots/search.png",
    width: 1908,
    height: 920,
    alt: "Rosu Search tab for finding beatmaps and packs in your Library",
  },
  {
    title: "Settings",
    chip: "Rosu — Settings",
    src: "/screenshots/settings.png",
    width: 1909,
    height: 918,
    alt: "Rosu Settings tab with app preferences and configuration options",
  },
];

// The three screenshots form one lightbox gallery, so the enlarged view can page
// left/right between them.
const galleryImages = screenshots.map((s) => ({ src: s.src, alt: s.alt, caption: s.title }));

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-14 lg:py-28">
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

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="absolute -inset-8 -z-10 rounded-[2.5rem] blur-2xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(255,46,151,0.3), transparent 70%)",
              }}
              aria-hidden="true"
            />

            <div className="float-idle card overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
                <span className="chip ml-3">Rosu — Dashboard</span>
              </div>
              <ZoomableShot
                images={[{ src: "/screenshots/dashboard.png", alt: DASHBOARD_ALT, caption: "Dashboard" }]}
                label="Enlarge the Rosu dashboard screenshot"
              >
                <Image
                  src="/screenshots/dashboard.png"
                  width={1278}
                  height={918}
                  alt={DASHBOARD_ALT}
                  priority
                  sizes="(min-width: 1024px) 480px, (min-width: 640px) 60vw, 100vw"
                  className="h-auto w-full transition-transform duration-200 group-hover:scale-[1.02]"
                />
              </ZoomableShot>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-border">
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

      {/* Screenshots — the real Rosu UI, running on Windows */}
      <section id="screenshots" className="scroll-mt-20 border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              A look inside
            </h2>
            <p className="mt-3 text-fg-muted">
              Rosu&apos;s actual interface: Packs, Search, and Settings, running on Windows.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {screenshots.map((shot, idx) => (
              <figure key={shot.title} className="card overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
                  <span className="chip ml-3">{shot.chip}</span>
                </div>
                <ZoomableShot
                  images={galleryImages}
                  index={idx}
                  label={`Enlarge the ${shot.title} screenshot`}
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
                </ZoomableShot>
                <figcaption className="border-t border-border px-4 py-2.5 text-sm font-medium text-fg">
                  {shot.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
