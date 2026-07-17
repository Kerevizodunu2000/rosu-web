// SPDX-License-Identifier: GPL-3.0-or-later

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

export default function Disclosure({ className = "" }: { className?: string }) {
  return (
    <div className={`card p-5 sm:p-6 ${className}`}>
      <h2 className="text-sm font-semibold text-fg">What we send</h2>
      <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed text-fg-muted">
        <li className="flex gap-2">
          <IconDot />
          <span>The title, description, and contact email you type above — nothing more.</span>
        </li>
        <li className="flex gap-2">
          <IconDot />
          <span>The screenshot you attach, if any. It&apos;s stored privately and never made public.</span>
        </li>
        <li className="flex gap-2">
          <IconDot />
          <span>Your browser&apos;s UI language, so we know whether to reply in English or Turkish.</span>
        </li>
      </ul>
      <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-fg-muted">
        Your IP address is hashed and used only to prevent spam — we never store it in the clear.
        There&apos;s no hidden telemetry: Rosu only ever sends what&apos;s visible on this page.
      </p>
    </div>
  );
}
