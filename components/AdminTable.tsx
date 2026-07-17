// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReportRecord } from "@/lib/db";
import Lightbox from "@/components/Lightbox";

type ArchiveResponse = { ok?: boolean; archived?: number; archiveName?: string };

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// The one signature touch: a small source dot (reused inside the existing
// `.chip` primitive) that's echoed as a thin left rail on the row itself, so
// the origin of a report (app vs web) reads spatially, not just as a label.
function SourceBadge({ source }: { source: ReportRecord["source"] }) {
  const isApp = source === "app";
  return (
    <span className="chip">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${isApp ? "bg-accent-2" : "bg-fg-muted/60"}`} />
      {source}
    </span>
  );
}

function DescriptionCell({
  report,
  expanded,
  onToggle,
}: {
  report: ReportRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isLong = report.description.length > 140;
  return (
    <div className="max-w-md">
      <p className="font-semibold text-fg">{report.title}</p>
      <p className={`mt-1 text-sm leading-relaxed text-fg-muted ${expanded ? "" : "line-clamp-2"}`}>
        {report.description}
      </p>
      {isLong && (
        <button type="button" onClick={onToggle} className="mt-1 text-xs font-medium text-accent-2 hover:underline">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

function ImageCell({
  report,
  onOpen,
}: {
  report: ReportRecord;
  onOpen: () => void;
}) {
  if (report.image_status === "stored") {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="View full-size screenshot"
        className="block h-11 w-11 overflow-hidden rounded-lg border border-border transition-transform hover:scale-105"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- proxied admin-only image, not a static asset Next can optimize */}
        <img
          src={`/api/admin/image/${report.id}`}
          alt="report screenshot"
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </button>
    );
  }
  if (report.image_status === "archived") {
    return <span className="chip">{report.archive_ref ?? "archived"}</span>;
  }
  if (report.image_status === "error") {
    return <span className="text-xs font-medium text-accent-rose">Image failed</span>;
  }
  return <span className="text-sm text-fg-muted">—</span>;
}

export default function AdminTable({ reports }: { reports: ReportRecord[] }) {
  const router = useRouter();
  const [busyArchive, setBusyArchive] = useState(false);
  const [busyLogout, setBusyLogout] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [lightboxId, setLightboxId] = useState<number | null>(null);

  // Transient toast-like message after an archive run — clears itself.
  useEffect(() => {
    if (!archiveMessage) return;
    const t = setTimeout(() => setArchiveMessage(null), 6000);
    return () => clearTimeout(t);
  }, [archiveMessage]);

  function toggleExpanded(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleArchive() {
    if (busyArchive) return;
    setBusyArchive(true);
    setArchiveMessage(null);
    try {
      const res = await fetch("/api/admin/archive", { method: "POST" });
      const data = (await res.json().catch(() => null)) as ArchiveResponse | null;
      if (res.ok && data?.ok) {
        setArchiveMessage(
          data.archived
            ? `Archived ${data.archived} report${data.archived === 1 ? "" : "s"} → ${data.archiveName ?? ""}`
            : "Nothing to archive."
        );
        router.refresh();
      } else {
        setArchiveMessage("Archive failed — please try again.");
      }
    } catch {
      setArchiveMessage("Archive failed — please try again.");
    } finally {
      setBusyArchive(false);
    }
  }

  async function handleLogout() {
    if (busyLogout) return;
    setBusyLogout(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      // Cookie is gone server-side; refreshing re-renders the (server) page,
      // which now falls through to the login view.
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg">Submissions</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {reports.length} unarchived report{reports.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {archiveMessage && <span className="max-w-xs text-xs text-fg-muted">{archiveMessage}</span>}
          <button
            type="button"
            onClick={handleLogout}
            disabled={busyLogout}
            className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Logout
          </button>
          <button
            type="button"
            onClick={handleArchive}
            disabled={busyArchive}
            aria-busy={busyArchive}
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyArchive ? "Archiving…" : "Archive now"}
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="card flex flex-col items-center gap-1.5 px-6 py-16 text-center">
          <p className="text-sm font-medium text-fg">No reports right now.</p>
          <p className="text-sm text-fg-muted">New submissions will show up here as they arrive.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-fg-muted">
                <th className="py-3 pl-4 pr-3 font-medium">Time</th>
                <th className="px-3 py-3 font-medium">Source</th>
                <th className="px-3 py-3 font-medium">Report</th>
                <th className="px-3 py-3 font-medium">Contact</th>
                <th className="px-3 py-3 font-medium">Diagnostics</th>
                <th className="py-3 pl-3 pr-4 font-medium">Image</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const isApp = r.source === "app";
                return (
                  <tr key={r.id} className="border-b border-border/70 align-top last:border-b-0 hover:bg-bg/40">
                    <td
                      className={`border-l-2 py-3 pl-4 pr-3 ${isApp ? "border-l-accent-2/50" : "border-l-transparent"}`}
                    >
                      <time
                        dateTime={r.created_at}
                        className="block whitespace-nowrap font-mono text-xs tabular-nums text-fg-muted"
                      >
                        {formatDate(r.created_at)}
                      </time>
                    </td>
                    <td className="px-3 py-3">
                      <SourceBadge source={r.source} />
                    </td>
                    <td className="px-3 py-3">
                      <DescriptionCell
                        report={r}
                        expanded={expanded.has(r.id)}
                        onToggle={() => toggleExpanded(r.id)}
                      />
                    </td>
                    <td className="px-3 py-3 text-sm text-fg-muted">
                      {r.contact ? (
                        <a href={`mailto:${r.contact}`} className="hover:text-accent-2 hover:underline">
                          {r.contact}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs leading-relaxed text-fg-muted">
                      <div>{r.app_version || "—"}</div>
                      <div>{r.os || "—"}</div>
                      <div>{r.lang || "—"}</div>
                    </td>
                    <td className="py-3 pl-3 pr-4">
                      <ImageCell report={r} onOpen={() => setLightboxId(r.id)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {lightboxId !== null && (
        <Lightbox
          src={`/api/admin/image/${lightboxId}`}
          alt="Report screenshot"
          onClose={() => setLightboxId(null)}
        />
      )}
    </div>
  );
}
