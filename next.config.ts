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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
