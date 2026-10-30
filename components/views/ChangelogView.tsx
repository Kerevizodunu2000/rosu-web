// SPDX-License-Identifier: GPL-3.0-or-later
import Markdown from "@/components/Markdown";
import Rich from "@/components/Rich";
import { fetchReleases } from "@/lib/releases";
import { GITHUB_URL } from "@/lib/links";
import { LOCALE_TAGS, type Locale } from "@/lib/i18n";
import { dict, fmt } from "@/content/i18n";

function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(LOCALE_TAGS[locale], { dateStyle: "long", timeZone: "UTC" });
}

export default async function ChangelogView({ locale }: { locale: Locale }) {
  const t = dict(locale).changelog;
  const releases = await fetchReleases();
  const releasesUrl = `${GITHUB_URL}/releases`;
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        <span className="text-gradient-accent">{t.title}</span>
      </h1>
      <p className="mt-3 text-fg-muted">
        <Rich text={fmt(t.intro, { url: releasesUrl })} locale={locale} />
        {locale !== "en" && <> {t.notesInEnglish}</>}
      </p>

      {!releases ? (
        <p className="card mt-10 p-6 text-sm text-fg-muted">
          <Rich text={fmt(t.unavailable, { url: releasesUrl })} locale={locale} />
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
                  {i === 0 && <span className="chip">{t.latest}</span>}
                  <time dateTime={r.published_at ?? undefined}>{formatDate(r.published_at, locale)}</time>
                </div>
              </div>
              <div lang="en"><Markdown source={r.body || t.noNotes} className="text-sm" headingOffset={0} /></div>
              <div className="mt-6 flex flex-wrap gap-3">
                {r.download_url && (
                  <a href={r.download_url} className="btn btn-primary" rel="noopener noreferrer">
                    {fmt(t.download, { tag: r.tag })}
                  </a>
                )}
                <a href={r.url} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                  {t.releasePage}
                </a>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
