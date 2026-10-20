// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useEffect, useRef, useState } from "react";
import { cardStats, type CardStats } from "@/lib/shareCard";

const W = 1200, H = 630;
const MAX_BYTES = 64 * 1024 * 1024;

function draw(canvas: HTMLCanvasElement, s: CardStats, name: string) {
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
  ctx.fillText(name ? `${name}'s osu! library` : "My osu! library", 72, 104);
  ctx.font = `700 120px ${font}`;
  ctx.fillStyle = "#ff66aa";
  ctx.fillText(new Intl.NumberFormat("en").format(s.sets), 72, 240);
  const setsWidth = ctx.measureText(new Intl.NumberFormat("en").format(s.sets)).width;
  ctx.fillStyle = "#ecebf5";
  ctx.font = `500 34px ${font}`;
  ctx.fillText("beatmap sets", 72 + setsWidth + 20, 240);

  ctx.font = `400 28px ${font}`;
  ctx.fillStyle = "#a6a5c0";
  const facts = [
    s.hours ? `${s.hours} hours of music` : "",
    s.starMax !== null ? `hardest ${s.starMax}★` : "",
    s.mania.length ? `mania: ${s.mania.map((k) => `${k.keys}K`).join(" · ")}` : "",
  ].filter(Boolean);
  ctx.fillText(facts.join("   ·   "), 72, 300);

  ctx.font = `600 26px ${font}`;
  ctx.fillStyle = "#ecebf5";
  ctx.fillText("Most sets by", 72, 380);
  ctx.font = `400 26px ${font}`;
  ctx.fillStyle = "#a6a5c0";
  s.topArtists.slice(0, 5).forEach((a, i) => {
    const label = a.artist.length > 34 ? a.artist.slice(0, 33) + "…" : a.artist;
    ctx.fillText(`${label} — ${a.sets}`, 72, 420 + i * 36);
  });

  let x = 700;
  ctx.font = `600 26px ${font}`;
  ctx.fillStyle = "#ecebf5";
  ctx.fillText("Modes", x, 380);
  ctx.font = `400 26px ${font}`;
  ctx.fillStyle = "#a6a5c0";
  s.modes.forEach((m, i) => ctx.fillText(`${m.mode} — ${m.sets}`, x, 420 + i * 36));

  ctx.font = `500 22px ${font}`;
  ctx.fillStyle = "#a6a5c0";
  x = 72;
  ctx.fillText("Made with Rosu · rosu-web.vercel.app", x, H - 48);
}

export default function ShareCard() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<CardStats | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stats && canvas.current) draw(canvas.current, stats, name.trim());
  }, [stats, name]);

  async function load(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (file.size > MAX_BYTES) { setError("That file is too big to be a Rosu export."); return; }
    try {
      const res = cardStats(JSON.parse(await file.text()));
      if ("error" in res) {
        setError(res.error === "empty" ? "That export lists no sets." : "That isn't a Rosu JSON export (Search → Export… → JSON).");
        setStats(null);
      } else setStats(res);
    } catch {
      setError("That file isn't valid JSON.");
      setStats(null);
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
          <span className="text-xs font-medium text-fg-muted">Rosu export (JSON)</span>
          <input type="file" accept=".json,application/json" onChange={(e) => load(e.target.files?.[0])}
            className="text-sm text-fg-muted file:mr-3 file:rounded-full file:border-0 file:bg-bg file:px-3 file:py-1.5 file:text-fg" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-fg-muted">Name on the card (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 32))} maxLength={32}
            className="field-input w-56 py-1.5" />
        </label>
        <button type="button" onClick={download} disabled={!stats} className="btn btn-primary disabled:opacity-50">
          Download PNG
        </button>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <canvas ref={canvas} width={W} height={H} role="img"
        aria-label={stats ? `Library card: ${stats.sets} beatmap sets` : "Library card preview"}
        className={`h-auto w-full rounded-xl border border-border ${stats ? "" : "hidden"}`} />
    </div>
  );
}
