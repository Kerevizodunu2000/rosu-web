// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import Link from "next/link";
import { getDb, findReportByStatusHash, type ReportRecord, type ReportStatus } from "@/lib/db";
import { hashStatusToken, isStatusToken, STATUS_LABELS } from "@/lib/reportStatus";
import { GITHUB_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Report status — Rosu",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const STEPS: ReportStatus[] = ["received", "in_review", "fixed"];

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" });
}

async function lookup(token: string): Promise<ReportRecord | null> {
  if (!isStatusToken(token)) return null;
  try {
    return await findReportByStatusHash(await getDb(), hashStatusToken(token));
  } catch {
    return null;
  }
}

function Timeline({ status }: { status: ReportStatus }) {
  // "closed" ends the line early: the report was looked at but won't be "fixed".
  const steps: ReportStatus[] = status === "closed" ? ["received", "in_review", "closed"] : STEPS;
  const reached = steps.indexOf(status);
  return (
    <ol className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-0" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i <= reached;
        const current = i === reached;
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
            <span className={`text-sm ${current ? "font-semibold text-fg" : done ? "text-fg" : "text-fg-muted"}`}>
              {STATUS_LABELS[s]}
              {current && <span className="sr-only"> (current)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function ReportStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await lookup(token);

  if (!report) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Report not found</h1>
        <p className="mt-3 leading-relaxed text-fg-muted">
          This tracking link is not valid, or the report it pointed to has been deleted. Reports are kept for
          twelve months and removed on request.
        </p>
        <Link href="/report" className="btn btn-secondary mt-8">
          Send a new report
        </Link>
      </section>
    );
  }

  const releaseUrl = report.fixed_in ? `${GITHUB_URL}/releases/tag/${encodeURIComponent(report.fixed_in)}` : null;

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-wide text-fg-muted">Report #{report.id}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        {STATUS_LABELS[report.status]}
      </h1>
      <p className="mt-3 text-fg-muted">
        Sent on {formatDate(report.created_at)}
        {report.status_updated_at ? ` · last updated ${formatDate(report.status_updated_at)}` : ""}.
      </p>

      <div className="card mt-8 p-6 sm:p-8">
        <Timeline status={report.status} />

        {report.status === "fixed" && report.fixed_in && releaseUrl && (
          <p className="mt-6 text-sm leading-relaxed text-fg-muted">
            Fixed in{" "}
            <a href={releaseUrl} className="font-medium text-accent-2 underline underline-offset-2">
              Rosu {report.fixed_in}
            </a>
            . Update the app to get the fix.
          </p>
        )}
        {report.status_note && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Note from the maintainer</p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-fg">{report.status_note}</p>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm leading-relaxed text-fg-muted">
        Keep this link to yourself — anyone who has it can see this page. The report&apos;s contents are never
        shown here.
      </p>
    </section>
  );
}
