// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useState } from "react";
import { compactRanges, MAX_NAMES, packReport, packUrl, SERIES_LABEL, type PackReport, type Standard } from "@/lib/packs";

const SHOW_LINKS = 60;   // per series; the copyable list carries the rest

export default function MissingPacks() {
  const [report, setReport] = useState<PackReport | null>(null);
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const run = (names: string[]) => setReport(packReport(names));
  const fromFiles = (files: FileList | null) => {
    // Only the names are read — the files themselves are never opened or sent.
    if (files?.length) run(Array.from(files, (f) => f.name));
  };

  async function copy(series: string, list: string) {
    try { await navigator.clipboard.writeText(list); setCopied(series); } catch { setCopied(null); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); fromFiles(e.dataTransfer.files); }}
        className={`card flex flex-col items-center gap-3 border-2 border-dashed px-6 py-10 text-center ${dragging ? "border-accent-2" : "border-border"}`}
      >
        <p className="text-sm font-medium text-fg">Drop your pack files here</p>
        <p className="max-w-md text-sm text-fg-muted">
          Only their names are read, in your browser — nothing is uploaded.
        </p>
        <label className="btn btn-secondary file-trigger relative cursor-pointer">
          Choose files…
          <input type="file" multiple className="sr-only" onChange={(e) => fromFiles(e.target.files)} />
        </label>
      </div>

      <details className="text-sm text-fg-muted">
        <summary className="cursor-pointer">…or paste a list of names</summary>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6}
          aria-label="Pack file names, one per line" placeholder={"S1234 - Beatmap Pack #1234.zip\nSM45 - …"}
          className="field-textarea mt-2 w-full font-mono text-xs" />
        <button type="button" className="btn btn-secondary mt-2" onClick={() => run(text.split(/\r?\n/))}>
          Check the list
        </button>
      </details>

      {/* Always mounted, so screen readers announce the summary when it changes. */}
      <p role="status" className="text-sm text-fg-muted empty:hidden">
        {report && `${report.total} packs recognised${report.unrecognised ? ` · ${report.unrecognised} other files ignored` : ""}.`}
        {report?.truncated && ` Only the first ${MAX_NAMES.toLocaleString("en")} names were read.`}
      </p>
      {report && (
        <section className="flex flex-col gap-5">
          {report.standard.length === 0 && (
            <p className="card px-5 py-4 text-sm text-fg">
              No standard packs (S, SM, ST, SC) found — those are the series a gap can be proven for.
            </p>
          )}
          {report.standard.map((s) => {
            const list = compactRanges(s.series, s.missing);
            return (
              <div key={s.series} className="card flex flex-col gap-3 px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold text-fg">
                    {SERIES_LABEL[s.series as Standard]} ({s.series}{s.lowest}–{s.series}{s.highest})
                  </h2>
                  <span className="text-sm text-fg-muted">
                    {s.owned} owned · <strong className="text-fg">{s.missing.length} missing</strong>
                  </span>
                </div>
                {s.missing.length > 0 ? (
                  <>
                    <ul className="flex flex-wrap gap-2 text-sm">
                      {s.missing.slice(0, SHOW_LINKS).map((n) => (
                        <li key={n}>
                          <a href={packUrl(`${s.series}${n}`)} target="_blank" rel="noopener noreferrer"
                            className="chip text-accent-2 hover:underline">{s.series}{n}</a>
                        </li>
                      ))}
                      {s.missing.length > SHOW_LINKS && (
                        <li className="text-fg-muted">… and {s.missing.length - SHOW_LINKS} more (in the list)</li>
                      )}
                    </ul>
                    <div className="flex items-center gap-3">
                      <button type="button" className="btn btn-secondary py-1.5 text-xs" onClick={() => copy(s.series, list)}>
                        Copy the list
                      </button>
                      {copied === s.series && <span className="text-xs text-fg-muted">Copied</span>}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-fg-muted">No gaps between your lowest and highest pack.</p>
                )}
              </div>
            );
          })}
          {report.other.length > 0 && (
            <p className="text-sm text-fg-muted">
              Also found: {report.other.map((o) => `${o.series} (${o.owned})`).join(", ")}. These series
              aren&apos;t numbered without gaps, so missing ones can&apos;t be told from names alone.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
