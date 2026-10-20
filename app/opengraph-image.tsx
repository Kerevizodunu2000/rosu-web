// SPDX-License-Identifier: GPL-3.0-or-later
import { ImageResponse } from "next/og";

// The social card for every page that does not define its own.
export const alt = "Rosu — the osu! beatmap-pack archive manager";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 88px",
          background: "radial-gradient(120% 120% at 15% 0%, #ffe3ef 0%, #fbeef5 38%, #f4f3f9 100%)",
          color: "#211f2b",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* The Rosu mark (same geometry as public/rosu-mark.svg). */}
          <svg width="132" height="132" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ff8ab5" />
                <stop offset="1" stopColor="#ff3d86" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="96" height="96" rx="24" fill="url(#g)" />
            <g transform="translate(50 50) scale(0.9)">
              <path d="M0 -26 L14 -8 L0 6 L-14 -8 Z" fill="#ffffff" />
              <path d="M0 6 L18 2 L10 22 Z" fill="#ffd0e2" />
              <path d="M0 6 L-18 2 L-10 22 Z" fill="#ffd0e2" />
              <path d="M0 6 L10 22 L-10 22 Z" fill="#ffb3d1" />
              <circle cy="-6" r="5" fill="#a5175a" />
            </g>
          </svg>
          <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: -4 }}>Rosu</div>
        </div>
        <div style={{ marginTop: 36, fontSize: 46, fontWeight: 600, lineHeight: 1.2, maxWidth: 980 }}>
          Your osu! beatmap packs — unpacked, deduplicated, backed up.
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: "#6a6a80", display: "flex", gap: 18 }}>
          <span>Free & open source</span>
          <span style={{ color: "#ff2e97" }}>·</span>
          <span>osu!(stable) + lazer</span>
          <span style={{ color: "#ff2e97" }}>·</span>
          <span>Windows</span>
        </div>
        <div style={{ position: "absolute", bottom: 40, right: 88, fontSize: 22, color: "#6a6a80" }}>
          Unofficial fan-made tool · not affiliated with ppy / osu!
        </div>
      </div>
    ),
    { ...size },
  );
}
