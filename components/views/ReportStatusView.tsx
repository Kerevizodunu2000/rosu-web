// SPDX-License-Identifier: GPL-3.0-or-later
import Link from "next/link";
import Rich from "@/components/Rich";
import { getDb, findReportByStatusHash, type ReportStatus } from "@/lib/db";
import { lookupReportStatus } from "@/lib/reportStatus";
import { GITHUB_URL } from "@/lib/links";
import { LOCALE_TAGS, localePath, type Locale } from "@/lib/i18n";
import { dict, fmt } from "@/content/i18n";

const STEPS: ReportStatus[] = ["received", "in_review", "fixed"];

function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(LOCALE_TAGS[locale], { dateStyle: "long", timeZone: "UTC" });
}

function Timeline({ status, labels, progress, current }: {
  status: ReportStatus; labels: Record<ReportStatus, string>; progress: string; current: string;
}) {
  // "closed" ends the line early: the report was looked at but won't be "fixed".
  const steps: ReportStatus[] = status === "closed" ? ["received", "in_review", "closed"] : STEPS;
  const reached = steps.indexOf(status);
  return (
    <ol className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-0" aria-label={progress}>
      {steps.map((s, i) => {
        const done = i <= reached;
        const isCurrent = i === reached;
        return (
          <li key={s} className="flex flex-1 items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
            <div className="flex items-center gap-0 sm:w-full">
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  done ? "border-accent-2 bg-accent-2 text-white" : "border-border text-fg-muted"
                }`}
              >
                {i + 1}
              </span>
              {i < steps.length - 1 && (
                <span aria-hidden className={`hidden h-px flex-1 sm:block ${i < reached ? "bg-accent-2" : "bg-border"}`} />
              )}
            </div>
            <span className={`text-sm ${isCurrent ? "font-semibold text-fg" : done ? "text-fg" : "text-fg-muted"}`}>
              {labels[s]}
              {isCurrent && <span className="sr-only"> {current}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function ReportStatusView({ locale, token }: { locale: Locale; token: string }) {
  const t = dict(locale).reportStatus;
  const result = await lookupReportStatus(token, { find: async (hash) => findReportByStatusHash(await getDb(), hash) });

  if (result.state === "error") {
    return (
      <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">{t.unavailable}</h1>
        <p className="mt-3 leading-relaxed text-fg-muted">{t.unavailableText}</p>
      </section>
    );
  }

  if (result.state === "missing") {
    return (
      <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">{t.notFound}</h1>
        <p className="mt-3 leading-relaxed text-fg-muted">{t.notFoundText}</p>
        <Link href={localePath(locale, "/report")} className="btn btn-secondary mt-8">{t.sendNew}</Link>
      </section>
    );
  }

  const { report } = result;
  const releaseUrl = report.fixed_in ? `${GITHUB_URL}/releases/tag/${encodeURIComponent(report.fixed_in)}` : null;

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-wide text-fg-muted">{fmt(t.reportN, { id: report.id })}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{t.statuses[report.status]}</h1>
      <p className="mt-3 text-fg-muted">
        {fmt(t.sentOn, { date: formatDate(report.created_at, locale) })}
        {report.status_updated_at ? fmt(t.updatedOn, { date: formatDate(report.status_updated_at, locale) }) : ""}
      </p>

      <div className="card mt-8 p-6 sm:p-8">
        <Timeline status={report.status} labels={t.statuses} progress={t.progress} current={t.current} />

        {report.status === "fixed" && report.fixed_in && releaseUrl && (
          <p className="mt-6 text-sm leading-relaxed text-fg-muted">
            <Rich text={fmt(t.fixedIn, { version: report.fixed_in, url: releaseUrl })} locale={locale} />
          </p>
        )}
        {report.status_note && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{t.note}</p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-fg">{report.status_note}</p>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm leading-relaxed text-fg-muted">{t.keepPrivate}</p>
    </section>
  );
}
