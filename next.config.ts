import type { NextConfig } from "next";

// Baseline security headers (defense-in-depth). Intentionally no strict
// script-src CSP: the report form loads Cloudflare Turnstile and Next injects
// inline runtime scripts, so a locked-down policy would break them. The safe,
// high-value subset below still blocks clickjacking (frame-ancestors + XFO),
// MIME sniffing, referrer leakage, and unrequested browser features.
// HSTS has no `preload`: the site lives on the shared vercel.app domain. No
// COEP: it would block the cross-origin Turnstile iframe on the report form.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // A status page's URL is its secret: never leak it in a Referer header.
      { source: "/report/status/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/:lang(tr|ja)/report/status/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/api/:path*", headers: [{ key: "Cross-Origin-Resource-Policy", value: "same-origin" }] },
    ];
  },
};

export default nextConfig;
