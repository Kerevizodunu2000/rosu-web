// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReportRecord, ReportStatus } from "@/lib/db";
import Lightbox from "@/components/Lightbox";
import { STATUS_LABELS, NOTE_MAX, BULK_MAX } from "@/lib/reportStatus";
import { adminHref, formatAdminDate, pageCount, PAGE_SIZE, Q_MAX, type AdminQuery } from "@/lib/adminQuery";

type ArchiveResponse = { ok?: boolean; archived?: number; archiveName?: string };

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
        <button type="button" onClick={onToggle} className="mt-1 text-xs font-medium text-accent-ink hover:underline">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

function ImageCell({
  report,
  onOpen,
  apiBase,
}: {
  report: ReportRecord;
  onOpen: () => void;
  apiBase: string;
}) {
  if (report.image_status === "stored") {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onOpen}
          aria-label="View full-size screenshot"
          className="block h-11 w-11 overflow-hidden rounded-lg border border-border transition-transform hover:scale-105"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- proxied admin-only image, not a static asset Next can optimize */}
          <img
            src={`${apiBase}/image/${report.id}`}
            alt="report screenshot"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </button>
        {report.image_original_name ? (
          <span
            title={report.image_original_name}
            className="block max-w-[8rem] truncate font-mono text-[10px] text-fg-muted"
          >
            {report.image_original_name}
          </span>
        ) : null}
      </div>
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

const STATUS_OPTIONS: ReportStatus[] = ["received", "in_review", "fixed", "closed"];

// Public status shown on the reporter's tracking page. Edits stay local until
// "Save", so a half-typed version number never reaches the reporter.
function StatusCell({ report, apiBase }: { report: ReportRecord; apiBase: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [fixedIn, setFixedIn] = useState(report.fixed_in ?? "");
  const [note, setNote] = useState(report.status_note ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dirty =
    status !== report.status || (fixedIn || "") !== (report.fixed_in ?? "") || (note || "") !== (report.status_note ?? "");

  async function save() {
    setState("saving");
    try {
      const res = await fetch(`${apiBase}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id, status, fixed_in: fixedIn, status_note: note }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (res.ok && data?.ok) {
        setState("saved");
        router.refresh();
      } else setState("error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex w-48 flex-col gap-1.5">
      <label className="sr-only" htmlFor={`status-${report.id}`}>Status of report {report.id}</label>
      <select
        id={`status-${report.id}`}
        value={status}
        onChange={(e) => { setStatus(e.target.value as ReportStatus); setState("idle"); }}
        className="field-input py-1 text-xs"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      {status === "fixed" && (
        <input
          value={fixedIn}
          onChange={(e) => { setFixedIn(e.target.value); setState("idle"); }}
          placeholder="Fixed in (e.g. 1.8.0)"
          aria-label="Fixed in version"
          className="field-input py-1 font-mono text-xs"
        />
      )}
      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); setState("idle"); }}
        maxLength={NOTE_MAX}
        rows={2}
        placeholder="Public note (optional)"
        aria-label="Public note shown to the reporter"
        className="field-textarea py-1 text-xs"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || state === "saving"}
          className="btn btn-secondary px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "saving" ? "Saving…" : "Save"}
        </button>
        {state === "saved" && <span className="text-xs text-fg-muted">Saved</span>}
        {state === "error" && <span className="text-xs text-accent-rose">Failed</span>}
      </div>
    </div>
  );
}

// Data-subject request: removes the report everywhere (Drive screenshot, its
// entry in the Drive archive, the database row). Typing the id is the confirm.
const DELETE_ERRORS: Record<string, string> = {
  not_found: "Already deleted — refresh the list.",
  busy: "The nightly archive was running — try again in a minute.",
  drive: "Google Drive did not answer — nothing was deleted from the database; try again.",
  archive_unreadable: "Its Drive archive could not be read — the report and its archive entry are still there (its screenshot may already be gone); check the archive by hand.",
  bad_request: "The request was refused — reload the page and try again.",
  unauthorized: "Your session ended — sign in again, then retry.",
  forbidden: "Your session ended — sign in again, then retry.",
  unavailable: "The server is busy right now — try again in a minute.",
  server: "Something went wrong on the server — try again; the activity log has the details.",
  network: "No connection to the server — try again.",
};

function DeleteButton({ report, apiBase }: { report: ReportRecord; apiBase: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [message, setMessage] = useState("");
  const setError = (text: string) => { setMessage(text); setState("error"); };
  async function run() {
    const typed = window.prompt(
      `Delete report #${report.id} everywhere — its database row, its screenshot and its copy in the ` +
      `Drive archive? This cannot be undone.\n\nType ${report.id} to confirm.`);
    if (typed === null) return;
    if (typed.trim() !== String(report.id)) { window.alert("The id did not match — nothing was deleted."); return; }
    setState("busy");
    try {
      const res = await fetch(`${apiBase}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id, confirm: report.id }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.ok) router.refresh();
      else {
        const byStatus = res.status === 401 ? "unauthorized" : res.status === 403 ? "forbidden"
          : res.status === 503 ? "unavailable" : "server";
        setError(DELETE_ERRORS[data?.error ?? ""] ?? DELETE_ERRORS[byStatus]);
      }
    } catch {
      setError(DELETE_ERRORS.network);
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={run} disabled={state === "busy"}
        aria-label={`Delete everywhere, report ${report.id}`}
        className="self-start text-xs font-medium text-accent-rose hover:underline disabled:opacity-50">
        {state === "busy" ? "Deleting…" : "Delete everywhere"}
      </button>
      {state === "error" && <span className="text-xs text-accent-rose" role="alert">{message}</span>}
    </div>
  );
}

function Filters({ query, pageBase, counts }: {
  query: AdminQuery; pageBase: string; counts: Record<ReportStatus, number>;
}) {
  // A plain GET form: the URL is the state, so filters survive a reload and
  // work without client JavaScript.
  return (
    <form method="get" action={pageBase} className="flex flex-wrap items-end gap-3 text-sm" role="search">
      {query.view === "all" && <input type="hidden" name="view" value="all" />}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-fg-muted">Search</span>
        <input name="q" defaultValue={query.q} maxLength={Q_MAX} placeholder="Title, text, e-mail or #id"
          className="field-input w-64 py-1.5" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-fg-muted">Status</span>
        <select name="status" defaultValue={query.status ?? ""} className="field-input py-1.5">
          <option value="">Any status</option>
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>{STATUS_LABELS[st]} ({counts[st]})</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-fg-muted">Source</span>
        <select name="source" defaultValue={query.source ?? ""} className="field-input py-1.5">
          <option value="">App and web</option>
          <option value="app">App</option>
          <option value="web">Web</option>
        </select>
      </label>
      <button type="submit" className="btn btn-secondary py-1.5">Apply</button>
      {(query.q || query.status || query.source) && (
        <a href={adminHref(pageBase, query, { q: "", status: null, source: null, page: 1 })}
          className="py-1.5 text-xs text-accent-ink hover:underline">Clear filters</a>
      )}
    </form>
  );
}

function Pager({ query, pageBase, total }: { query: AdminQuery; pageBase: string; total: number }) {
  const pages = pageCount(total);
  if (pages <= 1) return null;
  const link = (page: number, text: string, rel?: string) => (
    <a href={adminHref(pageBase, query, { page })} rel={rel} className="text-accent-ink hover:underline">{text}</a>
  );
  return (
    <nav aria-label="Pages" className="flex items-center gap-4 text-sm text-fg-muted">
      {query.page > 1 ? link(query.page - 1, "← Newer", "prev") : <span className="opacity-50">← Newer</span>}
      <span>Page {Math.min(query.page, pages)} of {pages}</span>
      {query.page < pages ? link(query.page + 1, "Older →", "next") : <span className="opacity-50">Older →</span>}
    </nav>
  );
}

function BulkBar({ ids, apiBase, onDone }: { ids: number[]; apiBase: string; onDone: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>("in_review");
  const [fixedIn, setFixedIn] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");
  async function apply() {
    setState("saving");
    try {
      const res = await fetch(`${apiBase}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status, fixed_in: fixedIn }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.ok) { setState("idle"); onDone(); router.refresh(); }
      else { setError(data?.error ?? ""); setState("error"); }
    } catch {
      setError("network");
      setState("error");
    }
  }
  return (
    <div className="card flex flex-wrap items-center gap-3 px-4 py-3 text-sm" role="region" aria-label="Bulk status">
      <span className="font-medium text-fg">{ids.length} selected</span>
      <label className="sr-only" htmlFor="bulk-status">New status</label>
      <select id="bulk-status" value={status} onChange={(e) => setStatus(e.target.value as ReportStatus)}
        className="field-input py-1 text-xs">
        {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
      </select>
      {status === "fixed" && (
        <input value={fixedIn} onChange={(e) => setFixedIn(e.target.value)} placeholder="Fixed in (e.g. 1.9.0)"
          aria-label="Fixed in version" className="field-input w-40 py-1 font-mono text-xs" />
      )}
      <button type="button" onClick={apply} disabled={state === "saving"}
        className="btn btn-primary px-3 py-1 text-xs disabled:opacity-50">
        {state === "saving" ? "Saving…" : `Set status for ${ids.length}`}
      </button>
      {state === "error" && (
        <span className="text-xs text-accent-rose" role="alert">
          {error === "bad_version" ? "Failed — use a version like 1.9.0"
            : error === "network" ? "Failed — no connection to the server"
            : "Failed — reload the page and try again"}
        </span>
      )}
      <span className="text-xs text-fg-muted">Each report keeps its own public note.</span>
    </div>
  );
}

export default function AdminTable({
  reports,
  total,
  counts,
  apiBase,
  query,
  pageBase,
}: {
  reports: ReportRecord[];
  total: number;
  counts: Record<ReportStatus, number>;
  apiBase: string;
  query: AdminQuery;
  pageBase: string;
}) {
  const view = query.view;
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggleSelected = (id: number) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else if (next.size < BULK_MAX) next.add(id);
    return next;
  });
  const allOnPage = reports.length > 0 && reports.every((r) => selected.has(r.id));
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
      const res = await fetch(`${apiBase}/archive`, { method: "POST" });
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

  async function handleLogout(all = false) {
    if (busyLogout) return;
    if (all && !window.confirm("Sign out every admin session, including this one?")) return;
    setBusyLogout(true);
    let ok = false;
    try {
      const res = await fetch(`${apiBase}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (!ok) {
      setBusyLogout(false);
      setArchiveMessage(all
        ? "Could not sign out everywhere — the server did not confirm it, so assume nothing was revoked."
        : "Could not sign out — please try again.");
      return;
    }
    // The session is gone server-side; refreshing re-renders the (server) page,
    // which now falls through to the login view.
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg">Submissions</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {`${total} ${view === "all" ? "" : "unarchived "}report${total === 1 ? "" : "s"}` +
              (query.q || query.status || query.source ? " match" + (total === 1 ? "es" : "") : "") +
              (view === "all" ? " (archived included)" : "") +
              (total > PAGE_SIZE ? ` · ${PAGE_SIZE} per page` : "")}
          </p>
          <nav aria-label="Report view" className="mt-2 flex gap-3 text-xs">
            <a href={adminHref(pageBase, query, { view: "unarchived", page: 1 })} aria-current={view === "unarchived" ? "page" : undefined}
              className={view === "unarchived" ? "font-semibold text-fg" : "text-accent-ink hover:underline"}>
              Unarchived
            </a>
            <a href={adminHref(pageBase, query, { view: "all", page: 1 })} aria-current={view === "all" ? "page" : undefined}
              className={view === "all" ? "font-semibold text-fg" : "text-accent-ink hover:underline"}>
              All
            </a>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {archiveMessage && <span className="max-w-xs text-xs text-fg-muted">{archiveMessage}</span>}
          <button
            type="button"
            onClick={() => handleLogout(true)}
            disabled={busyLogout}
            className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sign out everywhere
          </button>
          <button
            type="button"
            onClick={() => handleLogout(false)}
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

      <Filters query={query} pageBase={pageBase} counts={counts} />
      {selected.size > 0 && (
        <BulkBar ids={[...selected]} apiBase={apiBase} onDone={() => setSelected(new Set())} />
      )}

      {reports.length === 0 ? (
        <div className="card flex flex-col items-center gap-1.5 px-6 py-16 text-center">
          <p className="text-sm font-medium text-fg">
            {query.q || query.status || query.source ? "No reports match these filters." : view === "all" ? "No reports yet." : "No reports right now."}
          </p>
          <p className="text-sm text-fg-muted">New submissions will show up here as they arrive.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-fg-muted">
                <th className="py-3 pl-4 pr-1 font-medium">
                  <input type="checkbox" aria-label="Select every report on this page" checked={allOnPage}
                    onChange={() => setSelected(allOnPage ? new Set() : new Set(reports.slice(0, BULK_MAX).map((r) => r.id)))} />
                </th>
                <th className="py-3 pl-2 pr-3 font-medium">Time</th>
                <th className="px-3 py-3 font-medium">Source</th>
                <th className="px-3 py-3 font-medium">Report</th>
                <th className="px-3 py-3 font-medium">Contact</th>
                <th className="px-3 py-3 font-medium">Diagnostics</th>
                <th className="px-3 py-3 font-medium">Image</th>
                <th className="py-3 pl-3 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const isApp = r.source === "app";
                return (
                  <tr key={r.id} className="border-b border-border/70 align-top last:border-b-0 hover:bg-bg/40">
                    <td className={`border-l-2 py-3 pl-4 pr-1 ${isApp ? "border-l-accent-2/50" : "border-l-transparent"}`}>
                      <input type="checkbox" aria-label={`Select report ${r.id}`} checked={selected.has(r.id)}
                        onChange={() => toggleSelected(r.id)} />
                    </td>
                    <td className="py-3 pl-2 pr-3">
                      <time
                        dateTime={r.created_at}
                        className="block whitespace-nowrap font-mono text-xs tabular-nums text-fg-muted"
                      >
                        {formatAdminDate(r.created_at)}
                      </time>
                      <span className="mt-1 block font-mono text-[10px] text-fg-muted">#{r.id}</span>
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
                        <a href={`mailto:${r.contact}`} className="hover:text-accent-ink hover:underline">
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
                    <td className="px-3 py-3">
                      <ImageCell report={r} apiBase={apiBase} onOpen={() => setLightboxId(r.id)} />
                    </td>
                    <td className="py-3 pl-3 pr-4">
                      {/* Keyed on the saved values: after a save or a bulk change the
                          cell starts again from what the server holds. */}
                      <StatusCell key={`${r.id}:${r.status}:${r.status_updated_at ?? ""}`} report={r} apiBase={apiBase} />
                      <div className="mt-3 border-t border-border/70 pt-2">
                        <DeleteButton report={r} apiBase={apiBase} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pager query={query} pageBase={pageBase} total={total} />

      {lightboxId !== null && (
        <Lightbox
          images={[{ src: `${apiBase}/image/${lightboxId}`, alt: "Report screenshot" }]}
          onClose={() => setLightboxId(null)}
        />
      )}
    </div>
  );
}
