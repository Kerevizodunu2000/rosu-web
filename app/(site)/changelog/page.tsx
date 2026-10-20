// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import Markdown from "@/components/Markdown";
import { fetchReleases } from "@/lib/releases";
import { GITHUB_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Changelog — Rosu",
  description: "Every Rosu desktop release: what was added, changed and fixed, straight from the release notes.",
};
// Rebuilt at most hourly from GitHub Releases.
export const revalidate = 3600;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" });
}

export default async function ChangelogPage() {
  const releases = await fetchReleases();
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        Change<span className="text-gradient-accent">log</span>
      </h1>
      <p className="mt-3 text-fg-muted">
        Every desktop release, newest first — the same notes as on{" "}
        <a href={`${GITHUB_URL}/releases`} className="text-accent-2 underline underline-offset-2" target="_blank" rel="noopener noreferrer">
          GitHub Releases
        </a>
        .
      </p>

      {!releases ? (
        <p className="card mt-10 p-6 text-sm text-fg-muted">
          The release list could not be loaded right now. It is always available on{" "}
          <a href={`${GITHUB_URL}/releases`} className="text-accent-2 underline underline-offset-2">GitHub</a>.
        </p>
      ) : (
        <ol className="mt-10 flex flex-col gap-8">
          {releases.map((r, i) => (
            <li key={r.tag} className="card p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id={r.tag} className="scroll-mt-24 text-xl font-semibold tracking-tight text-fg">
                  <a href={`#${r.tag}`} className="hover:underline underline-offset-4">{r.name}</a>
                </h2>
                <div className="flex items-center gap-3 text-sm text-fg-muted">
                  {i === 0 && <span className="chip">latest</span>}
                  <time dateTime={r.published_at ?? undefined}>{formatDate(r.published_at)}</time>
                </div>
              </div>
              <Markdown source={r.body || "_No notes for this release._"} className="text-sm" />
              <div className="mt-6 flex flex-wrap gap-3">
                {r.download_url && (
                  <a href={r.download_url} className="btn btn-primary" rel="noopener noreferrer">
                    Download {r.tag}
                  </a>
                )}
                <a href={r.url} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                  Release page
                </a>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
