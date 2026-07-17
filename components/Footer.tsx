// SPDX-License-Identifier: GPL-3.0-or-later
import Brand from "./Brand";
import { CONTACT_EMAIL, DOWNLOAD_URL, GITHUB_URL } from "@/lib/links";

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.58 2 12.2c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.48 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.19-3.37-1.19-.46-1.2-1.11-1.52-1.11-1.52-.9-.63.07-.62.07-.62 1 .07 1.53 1.04 1.53 1.04.9 1.55 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.48A10.02 10.02 0 0 0 22 12.2C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Brand markSize={28} />
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              Rosu is free, open-source (GPL-3.0), donation-only and non-commercial.
              Unofficial, fan-made — not affiliated with or endorsed by ppy Pty Ltd or osu!.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:items-end">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-muted">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="transition-colors hover:text-fg hover:underline decoration-accent-2 underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-fg hover:underline decoration-accent-2 underline-offset-4"
              >
                <GithubIcon />
                GitHub
              </a>
            </div>
            <a href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              Download
            </a>
          </div>
        </div>

        <p className="mt-10 font-mono text-xs uppercase tracking-wide text-fg-muted/80">
          © {new Date().getFullYear()} Rosu · GPL-3.0-or-later
        </p>
      </div>
    </footer>
  );
}
