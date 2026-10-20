// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useEffect, useRef, useState } from "react";
import { cardStats, type CardStats } from "@/lib/shareCard";
import type { Dict } from "@/content/i18n/en";
import { LOCALE_TAGS, type Locale } from "@/lib/i18n";

type T = Dict["share"];
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

const W = 1200, H = 630;
const MAX_BYTES = 64 * 1024 * 1024;

function draw(canvas: HTMLCanvasElement, s: CardStats, name: string, t: T, tag: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#211f2b");
  bg.addColorStop(1, "#3a1530");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.85, 0, 40, W * 0.85, 0, 520);
  glow.addColorStop(0, "rgba(255,102,170,0.45)");
  glow.addColorStop(1, "rgba(255,102,170,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ecebf5";
  ctx.font = `600 34px ${font}`;
  const inner = W - 2 * 72;
  ctx.fillText(name ? fill(t.cardTitleNamed, { name }) : t.cardTitle, 72, 104, inner);
  ctx.font = `700 120px ${font}`;
  ctx.fillStyle = "#ff66aa";
  const count = new Intl.NumberFormat(tag).format(s.sets);
  ctx.fillText(count, 72, 240);
  const setsWidth = ctx.measureText(count).width;
  ctx.fillStyle = "#ecebf5";
  ctx.font = `500 34px ${font}`;
  ctx.fillText(t.cardSets, 72 + setsWidth + 20, 240, Math.max(120, W - 72 - (72 + setsWidth + 20)));

  ctx.font = `400 28px ${font}`;
  ctx.fillStyle = "#a6a5c0";
  const facts = [
    s.hours ? fill(t.cardHours, { n: s.hours }) : "",
    s.starMax !== null ? fill(t.cardHardest, { n: s.starMax }) : "",
    s.mania.length ? fill(t.cardMania, { keys: s.mania.map((k) => `${k.keys}K`).join(" · ") }) : "",
  ].filter(Boolean);
  ctx.fillText(facts.join("   ·   "), 72, 300, inner);

  ctx.font = `600 26px ${font}`;
  ctx.fillStyle = "#ecebf5";
  ctx.fillText(t.cardTopArtists, 72, 380, 600);
  ctx.font = `400 26px ${font}`;
  ctx.fillStyle = "#a6a5c0";
  // Four rows keep clear of the footer; each stays left of the Modes column.
  s.topArtists.slice(0, 4).forEach((a, i) => {
    const label = a.artist.length > 34 ? a.artist.slice(0, 33) + "…" : a.artist;
    ctx.fillText(`${label} — ${a.sets}`, 72, 420 + i * 36, 600);
  });

  let x = 700;
  ctx.font = `600 26px ${font}`;
  ctx.fillStyle = "#ecebf5";
  ctx.fillText(t.cardModes, x, 380, W - x - 72);
  ctx.font = `400 26px ${font}`;
  ctx.fillStyle = "#a6a5c0";
  s.modes.forEach((m, i) => ctx.fillText(`${m.mode} — ${m.sets}`, x, 420 + i * 36, W - x - 72));

  ctx.font = `500 22px ${font}`;
  ctx.fillStyle = "#a6a5c0";
  x = 72;
  ctx.fillText(t.cardFooter, x, H - 48, W - 2 * 72);
}

export default function ShareCard({ t, locale }: { t: T; locale: Locale }) {
  const tag = LOCALE_TAGS[locale];
  const canvas = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<CardStats | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const latest = useRef(0);   // a slower, older load must not overwrite a newer one

  useEffect(() => {
    if (stats && canvas.current) draw(canvas.current, stats, name.trim(), t, tag);
  }, [stats, name, t, tag]);

  async function load(file: File | undefined) {
    const ticket = ++latest.current;
    setError(null);
    setStats(null);
    if (!file) return;
    if (file.size > MAX_BYTES) { setError(t.tooBig); return; }
    setBusy(true);
    try {
      const res = cardStats(JSON.parse(await file.text()));
      if (ticket !== latest.current) return;
      if ("error" in res) {
        setError(res.error === "empty" ? t.empty : t.notExport);
      } else setStats(res);
    } catch {
      if (ticket === latest.current) setError(t.badJson);
    } finally {
      if (ticket === latest.current) setBusy(false);
    }
  }

  function download() {
    canvas.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rosu-library.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-wrap items-end gap-4 px-5 py-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-fg-muted">{t.file}</span>
          <input type="file" accept=".json,application/json" onChange={(e) => load(e.target.files?.[0])}
            className="text-sm text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-bg file:px-3 file:py-1.5 file:text-fg" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-fg-muted">{t.name}</span>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 32))} maxLength={32}
            className="field-input w-56 py-1.5" />
        </label>
        <button type="button" onClick={download} disabled={!stats} className="btn btn-primary disabled:opacity-50">
          {t.downloadPng}
        </button>
      </div>
      {busy && <p className="text-sm text-fg-muted" role="status">{t.reading}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      {stats?.capped && (
        <p className="text-sm text-fg-muted">{fill(t.capped, { n: stats.sets.toLocaleString(tag) })}</p>
      )}
      {stats && (
        // The card as text, for screen readers.
        <div className="sr-only">
          <p>{[`${stats.sets} ${t.cardSets}`, stats.hours ? fill(t.cardHours, { n: stats.hours }) : "",
            stats.starMax !== null ? fill(t.cardHardest, { n: stats.starMax }) : ""].filter(Boolean).join(", ")}.</p>
          {stats.topArtists.length > 0 && <p>{t.cardTopArtists}: {stats.topArtists.map((a) => `${a.artist} (${a.sets})`).join(", ")}.</p>}
          {stats.modes.length > 0 && <p>{t.cardModes}: {stats.modes.map((m) => `${m.mode} (${m.sets})`).join(", ")}.</p>}
        </div>
      )}
      <canvas ref={canvas} width={W} height={H} role="img"
        aria-label={stats ? fill(t.cardAria, { n: stats.sets }) : t.preview}
        className={`h-auto w-full rounded-xl border border-border ${stats ? "" : "hidden"}`} />
    </div>
  );
}
