// SPDX-License-Identifier: GPL-3.0-or-later
import type { ReactNode } from "react";
import Link from "next/link";
import Brand from "./Brand";
import CopyEmail from "./CopyEmail";
import { DOWNLOAD_URL, GITHUB_URL, PRIVACY_PATH, TERMS_PATH, SOCIAL } from "@/lib/links";

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.58 2 12.2c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.48 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.19-3.37-1.19-.46-1.2-1.11-1.52-1.11-1.52-.9-.63.07-.62.07-.62 1 .07 1.53 1.04 1.53 1.04.9 1.55 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.48A10.02 10.02 0 0 0 22 12.2C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2H21.5l-7.51 8.59L23 22h-6.75l-5.28-6.9L4.9 22H1.64l8.03-9.19L1 2h6.91l4.78 6.32L18.244 2Zm-1.18 18h1.83L7.02 3.9H5.06l12 16.1Z" />
    </svg>
  );
}
function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M23 12s0-3.2-.41-4.73a2.5 2.5 0 0 0-1.76-1.77C19.3 5.1 12 5.1 12 5.1s-7.3 0-8.83.4A2.5 2.5 0 0 0 1.41 7.27C1 8.8 1 12 1 12s0 3.2.41 4.73a2.5 2.5 0 0 0 1.76 1.77c1.53.4 8.83.4 8.83.4s7.3 0 8.83-.4a2.5 2.5 0 0 0 1.76-1.77C23 15.2 23 12 23 12ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  );
}
function RedditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
      <path d="M22 11.6a2.4 2.4 0 0 0-4.06-1.73 10.6 10.6 0 0 0-5.2-1.5l.88-3.94 2.76.62a1.55 1.55 0 1 0 .2-.98l-3.27-.73a.48.48 0 0 0-.58.37l-1.04 4.66a10.6 10.6 0 0 0-5.26 1.5A2.4 2.4 0 1 0 3.4 13.7a4.3 4.3 0 0 0-.05.67c0 3.08 3.87 5.58 8.65 5.58s8.65-2.5 8.65-5.58a4.3 4.3 0 0 0-.05-.67A2.4 2.4 0 0 0 22 11.6ZM8.1 13.3a1.2 1.2 0 1 1 2.4 0 1.2 1.2 0 0 1-2.4 0Zm7.4 3.2c-.87.87-2.6.94-3.5.94s-2.63-.07-3.5-.94a.39.39 0 0 1 .55-.55c.53.53 1.68.66 2.95.66s2.42-.13 2.95-.66a.39.39 0 1 1 .55.55ZM15.4 14.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z" />
    </svg>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-fg-muted transition-colors hover:border-accent-2 hover:text-accent-2"
    >
      {children}
    </a>
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
              <Link
                href={PRIVACY_PATH}
                className="transition-colors hover:text-fg hover:underline decoration-accent-2 underline-offset-4"
              >
                Privacy
              </Link>
              <Link
                href={TERMS_PATH}
                className="transition-colors hover:text-fg hover:underline decoration-accent-2 underline-offset-4"
              >
                Terms
              </Link>
              <CopyEmail className="transition-colors hover:text-fg hover:underline decoration-accent-2 underline-offset-4" />
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

            <div className="flex items-center gap-2.5">
              <SocialLink href={SOCIAL.instagram} label="Rosu on Instagram"><InstagramIcon /></SocialLink>
              <SocialLink href={SOCIAL.x} label="Rosu on X"><XIcon /></SocialLink>
              <SocialLink href={SOCIAL.youtube} label="Rosu on YouTube"><YoutubeIcon /></SocialLink>
              <SocialLink href={SOCIAL.reddit} label="Rosu on Reddit"><RedditIcon /></SocialLink>
            </div>

            <a href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              Download
            </a>
          </div>
        </div>

        <p className="mt-10 font-mono text-xs uppercase tracking-wide text-fg-muted">
          © {new Date().getFullYear()} Rosu · GPL-3.0-or-later
        </p>
      </div>
    </footer>
  );
}
