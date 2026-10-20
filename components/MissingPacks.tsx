// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useState } from "react";
import { compactRanges, MAX_NAMES, packReport, packUrl, SERIES_LABEL, type PackReport, type Standard } from "@/lib/packs";
import type { Dict } from "@/content/i18n/en";

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

const SHOW_LINKS = 60;   // per series; the copyable list carries the rest

export default function MissingPacks({ t }: { t: Dict["missing"] }) {
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
        <p className="text-sm font-medium text-fg">{t.drop}</p>
        <p className="max-w-md text-sm text-fg-muted">{t.dropNote}</p>
        <label className="btn btn-secondary file-trigger relative cursor-pointer">
          {t.choose}
          <input type="file" multiple className="sr-only" onChange={(e) => fromFiles(e.target.files)} />
        </label>
      </div>

      <details className="text-sm text-fg-muted">
        <summary className="cursor-pointer">{t.paste}</summary>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6}
          aria-label={t.pasteLabel} placeholder={"S1234 - Beatmap Pack #1234.zip\nSM45 - …"}
          className="field-textarea mt-2 w-full font-mono text-xs" />
        <button type="button" className="btn btn-secondary mt-2" onClick={() => run(text.split(/\r?\n/))}>
          {t.check}
        </button>
      </details>

      {/* Always mounted, so screen readers announce the summary when it changes. */}
      <p role="status" className="text-sm text-fg-muted empty:hidden">
        {report && `${fill(t.recognised, { n: report.total })}${report.unrecognised ? fill(t.ignored, { n: report.unrecognised }) : ""}.`}
        {report?.truncated && fill(t.truncated, { n: MAX_NAMES.toLocaleString() })}
      </p>
      {report && (
        <section className="flex flex-col gap-5">
          {report.standard.length === 0 && (
            <p className="card px-5 py-4 text-sm text-fg">
              {t.noStandard}
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
                    {fill(t.owned, { n: s.owned })} · <strong className="text-fg">{fill(t.missingCount, { n: s.missing.length })}</strong>
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
                        <li className="text-fg-muted">{fill(t.more, { n: s.missing.length - SHOW_LINKS })}</li>
                      )}
                    </ul>
                    <div className="flex items-center gap-3">
                      <button type="button" className="btn btn-secondary py-1.5 text-xs" onClick={() => copy(s.series, list)}>
                        {t.copy}
                      </button>
                      {copied === s.series && <span className="text-xs text-fg-muted">✓</span>}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-fg-muted">{t.noGaps}</p>
                )}
              </div>
            );
          })}
          {report.other.length > 0 && (
            <p className="text-sm text-fg-muted">
              {fill(t.alsoFound, { list: report.other.map((o) => `${o.series} (${o.owned})`).join(", ") })}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
