// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { wrappedStats, wrappedYears, type WrappedStats } from "@/lib/wrapped";
import type { Dict } from "@/content/i18n/en";
import { LOCALE_TAGS, type Locale } from "@/lib/i18n";

const W = 1080, H = 1350;
const MAX_BYTES = 64 * 1024 * 1024;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

type T = { wrapped: Dict["wrapped"]; share: Dict["share"] };

function monthNames(tag: string, width: "long" | "narrow"): string[] {
  const f = new Intl.DateTimeFormat(tag, { month: width, timeZone: "UTC" });
  return Array.from({ length: 12 }, (_, m) => f.format(new Date(Date.UTC(2026, m, 1))));
}

function draw(canvas: HTMLCanvasElement, s: WrappedStats, t: T, tag: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue("--accent-2").trim() || "#ff66aa";
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#1c1a26");
  bg.addColorStop(1, "#3a1530");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const pad = 88, inner = W - 2 * pad;

  ctx.fillStyle = "#ecebf5";
  ctx.font = `600 44px ${font}`;
  ctx.fillText(`Rosu Wrapped ${s.year}`, pad, 150, inner);
  ctx.font = `400 34px ${font}`;
  ctx.fillStyle = "#a6a5c0";
  ctx.fillText(fill(t.wrapped.slideAdded, { year: s.year }), pad, 250, inner);
  ctx.font = `700 190px ${font}`;
  ctx.fillStyle = accent;
  ctx.fillText(new Intl.NumberFormat(tag).format(s.added), pad, 440, inner);
  ctx.font = `500 40px ${font}`;
  ctx.fillStyle = "#ecebf5";
  ctx.fillText(t.wrapped.slideAddedUnit, pad, 500, inner);

  // Sets per month: one series, thin columns on one baseline, the peak labelled.
  const months = monthNames(tag, "narrow");
  const peak = Math.max(1, ...s.byMonth);
  const base = 800, plot = 210, slot = inner / 12, bar = Math.min(40, slot - 12);
  ctx.fillStyle = "rgba(236,235,245,0.35)";
  ctx.fillRect(pad, base, inner, 2);
  s.byMonth.forEach((n, m) => {
    const x = pad + m * slot + (slot - bar) / 2;
    const h = n ? Math.max(6, (n / peak) * plot) : 0;
    ctx.fillStyle = accent;
    if (h) {
      ctx.beginPath();
      ctx.roundRect(x, base - h, bar, h, [6, 6, 0, 0]);
      ctx.fill();
    }
    ctx.fillStyle = "#a6a5c0";
    ctx.font = `400 24px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(months[m], x + bar / 2, base + 40);
    if (m === s.busiestMonth) {
      ctx.fillStyle = "#ecebf5";
      ctx.font = `600 26px ${font}`;
      ctx.fillText(String(n), x + bar / 2, base - h - 14);
    }
    ctx.textAlign = "left";
  });

  ctx.fillStyle = "#ecebf5";
  ctx.font = `600 34px ${font}`;
  ctx.fillText(t.wrapped.slideArtists, pad, 940, inner);
  ctx.font = `400 32px ${font}`;
  ctx.fillStyle = "#a6a5c0";
  s.topArtists.slice(0, 3).forEach((a, i) => {
    const label = a.artist.length > 32 ? a.artist.slice(0, 31) + "…" : a.artist;
    ctx.fillText(`${i + 1}. ${label} — ${a.sets}`, pad, 995 + i * 48, inner);
  });

  const facts = [
    s.topMode ? fill(t.wrapped.slideMode, { mode: s.topMode }) : "",
    s.hours ? fill(t.wrapped.slideHours, { n: s.hours }) : "",
    s.starMax !== null ? fill(t.wrapped.slideStars, { n: s.starMax }) : "",
  ].filter(Boolean);
  ctx.font = `400 30px ${font}`;
  facts.forEach((f, i) => ctx.fillText(f, pad, 1180 + i * 44, inner));

  ctx.font = `500 26px ${font}`;
  ctx.fillStyle = "#a6a5c0";
  ctx.fillText(t.wrapped.cardFooter, pad, H - 50, inner);
}

export default function Wrapped({ t, locale }: { t: T; locale: Locale }) {
  const tag = LOCALE_TAGS[locale];
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(0);
  const [data, setData] = useState<unknown>(null);
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    if (data === null || year === null) return null;
    const s = wrappedStats(data, year);
    return "error" in s ? null : s;
  }, [data, year]);
  const longMonths = useMemo(() => monthNames(tag, "long"), [tag]);

  useEffect(() => {
    if (stats && stats.added > 0 && canvas.current) draw(canvas.current, stats, t, tag);
  }, [stats, t, tag]);

  async function load(file: File | undefined) {
    const ticket = ++latest.current;
    setError(null);
    setBusy(false);
    setData(null);
    setYears([]);
    setYear(null);
    if (!file) return;
    if (file.size > MAX_BYTES) { setError(t.share.tooBig); return; }
    setBusy(true);
    try {
      const json: unknown = JSON.parse(await file.text());
      if (ticket !== latest.current) return;
      const ys = wrappedYears(json);
      if ("error" in ys) {
        setError(ys.error === "no_dates" ? t.wrapped.noYears : t.share.notExport);
        return;
      }
      setData(json);
      setYears(ys);
      setYear(ys[0]);
    } catch {
      if (ticket === latest.current) setError(t.share.badJson);
    } finally {
      if (ticket === latest.current) setBusy(false);
    }
  }

  function download() {
    canvas.current?.toBlob((blob) => {
      if (!blob || !stats) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rosu-wrapped-${stats.year}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  const peak = stats ? Math.max(1, ...stats.byMonth) : 1;
  return (
    <div className="flex flex-col gap-6">
      <div className="card flex flex-wrap items-end gap-4 px-5 py-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-fg-muted">{t.share.file}</span>
          <input type="file" accept=".json,application/json" onChange={(e) => load(e.target.files?.[0])}
            className="text-sm text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-bg file:px-3 file:py-1.5 file:text-fg" />
        </label>
        {years.length > 0 && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-fg-muted">{t.wrapped.year}</span>
            <select value={year ?? ""} onChange={(e) => setYear(Number(e.target.value))} className="field-input py-1.5">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        )}
        <button type="button" onClick={download} disabled={!stats || stats.added === 0} className="btn btn-primary disabled:opacity-50">
          {t.wrapped.downloadPng}
        </button>
      </div>
      {busy && <p className="text-sm text-fg-muted" role="status">{t.share.reading}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}

      {stats && stats.added === 0 && (
        <p className="card px-5 py-8 text-center text-sm text-fg-muted">{fill(t.wrapped.nothingThisYear, { year: stats.year })}</p>
      )}
      {stats && stats.added > 0 && (
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="flex flex-col gap-4">
            <section className="card px-6 py-6">
              <p className="text-sm text-fg-muted">{fill(t.wrapped.slideAdded, { year: stats.year })}</p>
              <p className="mt-1 text-5xl font-semibold tracking-tight text-gradient-accent tabular-nums">
                {new Intl.NumberFormat(tag).format(stats.added)}
              </p>
              <p className="text-fg">{t.wrapped.slideAddedUnit}</p>
            </section>
            {stats.busiestMonth !== null && (
              <section className="card px-6 py-6">
                <p className="text-fg">{fill(t.wrapped.slideMonth, { month: longMonths[stats.busiestMonth], n: stats.byMonth[stats.busiestMonth] })}</p>
                <div className="mt-4 flex h-28 items-end gap-1.5" aria-hidden="true">
                  {stats.byMonth.map((n, m) => (
                    <div key={m} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${longMonths[m]}: ${n}`}>
                      {m === stats.busiestMonth && <span className="text-[11px] tabular-nums text-fg">{n}</span>}
                      <div className="w-full max-w-6 rounded-t bg-[var(--chart-mark)]" style={{ height: `${n ? Math.max(4, (n / peak) * 80) : 0}px` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-1 h-px bg-fg-muted/40" aria-hidden="true" />
                <ul className="sr-only">
                  {stats.byMonth.map((n, m) => <li key={m}>{longMonths[m]}: {n}</li>)}
                </ul>
              </section>
            )}
            {stats.topArtists.length > 0 && (
              <section className="card px-6 py-6">
                <p className="text-fg">{t.wrapped.slideArtists}</p>
                <ol className="mt-2 list-decimal pl-5 text-sm text-fg-muted">
                  {stats.topArtists.map((a) => <li key={a.artist}>{a.artist} — {a.sets}</li>)}
                </ol>
              </section>
            )}
            <section className="card flex flex-col gap-1 px-6 py-6 text-sm text-fg-muted">
              {stats.topMode && <p>{fill(t.wrapped.slideMode, { mode: stats.topMode })}</p>}
              {stats.hours > 0 && <p>{fill(t.wrapped.slideHours, { n: stats.hours })}</p>}
              {stats.starMax !== null && <p>{fill(t.wrapped.slideStars, { n: stats.starMax })}</p>}
            </section>
          </div>
          <canvas ref={canvas} width={W} height={H} aria-hidden="true"
            className="h-auto w-full rounded-xl border border-border" />
        </div>
      )}
    </div>
  );
}
