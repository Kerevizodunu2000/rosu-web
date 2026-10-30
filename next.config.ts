import type { NextConfig } from "next";

// Baseline security headers (defense-in-depth). Intentionally no strict
// script-src CSP: the report form loads Cloudflare Turnstile and Next injects
// inline runtime scripts, so a locked-down policy would break them. The safe,
// high-value subset below still blocks clickjacking (frame-ancestors + XFO),
// MIME sniffing, referrer leakage, and unrequested browser features.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // 652 = the hero at 372 CSS px on a 1.75x phone; the default list jumps 640 to 750.
    deviceSizes: [640, 652, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // A status page's URL is its secret: never leak it in a Referer header.
      { source: "/report/status/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/:lang(tr|ja)/report/status/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
};

export default nextConfig;
