// SPDX-License-Identifier: GPL-3.0-or-later
import type { Dict } from "@/content/i18n/en";

// Plain-language privacy disclosure for the report form — no hidden telemetry,
// no vague "we may collect data" language. Sourced from the design spec's
// privacy section (§3 Constraints: "store only what the user types + light
// diagnostics ... no hidden telemetry. Disclose on the form what is sent.
// Never store raw IPs — salted hash only, used for rate limiting.").
function IconDot() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-accent-2"
    >
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

export default function Disclosure({ className = "", t }: { className?: string; t: Dict["disclosure"] }) {
  return (
    <div className={`card p-5 sm:p-6 ${className}`}>
      <h2 className="text-sm font-semibold text-fg">{t.title}</h2>
      <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed text-fg-muted">
        {t.items.map((item) => (
          <li key={item} className="flex gap-2">
            <IconDot />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-fg-muted">{t.footer}</p>
    </div>
  );
}
