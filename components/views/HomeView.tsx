// SPDX-License-Identifier: GPL-3.0-or-later
// The landing page, in any site language (app/(site)/page.tsx for English,
// app/(intl)/[lang]/page.tsx for the others).
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import ZoomableShot from "@/components/ZoomableShot";
import ShotCarousel, { type CarouselShot } from "@/components/ShotCarousel";
import Rich from "@/components/Rich";
import { DOWNLOAD_URL, GITHUB_URL, SITE_URL } from "@/lib/links";
import { localePath, type Locale } from "@/lib/i18n";
import { dict, fmt } from "@/content/i18n";

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

const FEATURE_ICONS: ReactNode[] = [
  <IconUnpack key="unpack" />, <IconDedup key="dedup" />, <IconMissing key="missing" />,
  <IconImport key="import" />, <IconBackup key="backup" />, <IconLocal key="local" />,
];

// Which desktop release the screenshots below were captured from. Update this
// (and the images) together when refreshing them, so the site never shows an
// unlabeled/outdated UI.
const SHOTS_APP_VERSION = "1.3.3";

const SHOT_FILES = [
  { key: "packs", src: "/screenshots/packs.png", width: 1906, height: 917 },
  { key: "search", src: "/screenshots/search.png", width: 1908, height: 920 },
  { key: "artists", src: "/screenshots/artists.png", width: 1904, height: 916 },
  { key: "shortcuts", src: "/screenshots/shortcuts.png", width: 1276, height: 921 },
  { key: "logs", src: "/screenshots/logs.png", width: 1902, height: 916 },
  { key: "settings", src: "/screenshots/settings.png", width: 1909, height: 918 },
] as const;

export default function HomeView({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const h = t.home;
  // Structured data for search engines (schema.org SoftwareApplication).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Rosu",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows",
    description: t.meta.siteDescription,
    inLanguage: locale,
    url: `${SITE_URL}${localePath(locale, "/")}`,
    downloadUrl: DOWNLOAD_URL,
    codeRepository: GITHUB_URL,
    license: "https://www.gnu.org/licenses/gpl-3.0.html",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  const shots: CarouselShot[] = SHOT_FILES.map((f) => ({
    ...f, title: h.shots[f.key].title, alt: h.shots[f.key].alt, chip: `Rosu — ${h.shots[f.key].title}`,
  }));
  const carouselLabels = { ...h.carousel, lightbox: { previous: h.lightbox.previous, next: h.lightbox.next, close: h.lightbox.close } };
  return (
    <>
      <script
        type="application/ld+json"
        // Static data, and "<" is escaped so nothing in it can close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-14 lg:py-28">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-[3.15rem] lg:leading-[1.08]">
              {h.heroBefore && <>{h.heroBefore}{" "}</>}
              <span className="text-gradient-accent">{h.heroAccent}</span>{" "}{h.heroAfter}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">{h.heroText}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                {t.common.downloadWindows}
              </a>
              <Link href={localePath(locale, "/report")} className="btn btn-secondary">
                {t.common.reportProblem}
              </Link>
            </div>

            <p className="mt-5 font-mono text-xs uppercase tracking-wide text-fg-muted">{h.tagline}</p>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="absolute -inset-8 -z-10 rounded-[2.5rem] blur-2xl"
              style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--accent-2) 30%, transparent), transparent 70%)" }}
              aria-hidden="true"
            />

            <div className="float-idle card overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
                <span className="chip ml-3">Rosu — {h.dashboardCaption}</span>
              </div>
              <ZoomableShot
                images={[{ src: "/screenshots/dashboard.png", alt: h.dashboardAlt, caption: h.dashboardCaption }]}
                label={h.enlargeDashboard}
                labels={carouselLabels.lightbox}
              >
                <Image
                  src="/screenshots/dashboard.png"
                  width={1278}
                  height={918}
                  alt={h.dashboardAlt}
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
            <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{h.featuresTitle}</h2>
            <p className="mt-3 text-fg-muted">{h.featuresText}</p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {h.features.map((feature, i) => (
              <article
                key={feature.title}
                className="card p-6 transition duration-200 ease-out hover:-translate-y-1 hover:border-accent-2/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/12 text-accent-2">
                  {FEATURE_ICONS[i]}
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
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{h.shotsTitle}</h2>
              <span className="chip">Rosu v{SHOTS_APP_VERSION}</span>
            </div>
            <p className="mt-3 text-fg-muted">
              <Rich text={fmt(h.shotsText, { version: SHOTS_APP_VERSION })} locale={locale} />
            </p>
          </div>

          <div className="mt-12">
            <ShotCarousel shots={shots} labels={carouselLabels} />
          </div>
        </div>
      </section>
    </>
  );
}
