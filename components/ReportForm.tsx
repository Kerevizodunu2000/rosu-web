// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Script from "next/script";
import { LIMITS, ALLOWED_MIME } from "@/lib/validation";
import { CONTACT_EMAIL } from "@/lib/links";

// Cloudflare's script attaches a global `window.turnstile`; we drive it via the
// explicit render API (not the implicit `cf-turnstile` div) so we can reset the
// widget after a failed submit instead of leaving a stale/expired token behind.
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // client-side cap; server allows a bit more headroom
const ACCEPT_MIME = Object.keys(ALLOWED_MIME).join(","); // e.g. "image/png,image/jpeg,..."

type Screenshot = { name: string; mime: string; b64: string; previewUrl: string };
type Status = "idle" | "sending" | "success" | "error";

function friendlyError(code: string | undefined): string {
  switch (code) {
    case "captcha":
      return "Please complete the captcha and try again.";
    case "rate_limited":
    case "rate_minute":
    case "rate_day":
    case "rate_global":
      return "Too many submissions — please try again later.";
    case "missing_fields":
      return "Title and description are required.";
    default:
      return "Something went wrong sending your report.";
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15V4M8 8l4-4 4 4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function ReportForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [hp, setHp] = useState(""); // honeypot — real users never fill this in
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  function renderTurnstile() {
    if (!SITE_KEY || !turnstileRef.current || !window.turnstile || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: SITE_KEY,
      theme: "auto",
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);

    if (!Object.prototype.hasOwnProperty.call(ALLOWED_MIME, file.type)) {
      setFileError("Please choose a PNG, JPEG, GIF, WEBP, or BMP image.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFileError(`That image is too large — max ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`);
      e.target.value = "";
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      setScreenshot({ name: file.name, mime: file.type, b64, previewUrl: dataUrl });
    } catch {
      setFileError("Could not read that file — please try another.");
    }
  }

  function clearScreenshot() {
    setScreenshot(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    status !== "sending" &&
    (!SITE_KEY || turnstileToken.length > 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    if (!title.trim() || !description.trim()) return;
    if (SITE_KEY && !turnstileToken) {
      setStatus("error");
      setErrorMessage(friendlyError("captcha"));
      return;
    }

    setStatus("sending");
    setErrorMessage(null);

    const lang = navigator.language?.toLowerCase().startsWith("tr") ? "tr" : "en";
    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      contact: contact.trim(),
      lang,
      hp,
      turnstileToken,
    };
    if (screenshot) {
      payload.image_b64 = screenshot.b64;
      payload.image_mime = screenshot.mime;
    }

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (data?.ok) {
        setStatus("success");
        return;
      }

      setErrorMessage(friendlyError(data?.error));
      setStatus("error");
      if (data?.error === "captcha" && widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken("");
      }
    } catch {
      setErrorMessage(friendlyError(undefined));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" aria-live="polite" className="py-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/12 text-accent-2">
          <IconCheck />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-fg">Thanks — your report reached us.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg-muted">
          {contact.trim()
            ? "We'll reply to the email you left if we need more details or have an update."
            : "Leave a contact email next time if you'd like a reply from us."}
        </p>
        <Link href="/" className="btn btn-secondary mt-6">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Honeypot — hidden from sighted and AT users alike; a filled-in value marks the submission as spam server-side. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="hp">Leave this field empty</label>
        <input
          type="text"
          id="hp"
          name="hp"
          tabIndex={-1}
          autoComplete="off"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
        />
      </div>

      <fieldset disabled={status === "sending"} className="m-0 flex flex-col gap-6 border-0 p-0">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="title" className="field-label">
              Title
            </label>
            <span className="font-mono text-xs text-fg-muted">
              {title.length}/{LIMITS.title}
            </span>
          </div>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={LIMITS.title}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="One line describing the problem"
            className="field-input mt-1.5"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="description" className="field-label">
              What happened?
            </label>
            <span className="font-mono text-xs text-fg-muted">
              {description.length}/{LIMITS.description}
            </span>
          </div>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            maxLength={LIMITS.description}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Steps to reproduce, what you expected, what happened instead…"
            className="field-textarea mt-1.5"
          />
        </div>

        <fieldset className="m-0 border-0 p-0">
          <legend className="field-label p-0">
            Screenshot <span className="font-normal text-fg-muted">(optional)</span>
          </legend>

          <div className="mt-1.5">
            {!screenshot ? (
              <span className="file-trigger relative inline-block">
                <input
                  ref={fileInputRef}
                  id="screenshot"
                  name="screenshot"
                  type="file"
                  accept={ACCEPT_MIME}
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <label
                  htmlFor="screenshot"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-bg px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-accent-2 hover:text-accent-2"
                >
                  <IconUpload />
                  Choose image
                </label>
              </span>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-bg p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- short-lived local data: URL preview, not a served asset */}
                <img
                  src={screenshot.previewUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{screenshot.name}</span>
                <button
                  type="button"
                  onClick={clearScreenshot}
                  aria-label="Remove screenshot"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-accent/10 hover:text-accent-2"
                >
                  <IconX />
                </button>
              </div>
            )}
          </div>

          <p className="field-hint">PNG, JPEG, GIF, WEBP, or BMP — up to 4 MB.</p>
          {fileError && (
            <p className="field-error" role="alert">
              {fileError}
            </p>
          )}
        </fieldset>

        <div>
          <label htmlFor="contact" className="field-label">
            Contact email <span className="font-normal text-fg-muted">(optional)</span>
          </label>
          <input
            id="contact"
            name="contact"
            type="email"
            autoComplete="email"
            maxLength={LIMITS.contact}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="you@example.com"
            className="field-input mt-1.5"
          />
          <p className="field-hint">So we can reply if we have a question or a fix. Never shared.</p>
        </div>

        <div>
          {SITE_KEY ? (
            <>
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                strategy="afterInteractive"
                onReady={renderTurnstile}
              />
              <div ref={turnstileRef} />
            </>
          ) : (
            <p className="text-xs text-fg-muted">Captcha will appear once configured.</p>
          )}
        </div>
      </fieldset>

      {status === "error" && errorMessage && (
        <div role="alert" className="rounded-xl border border-accent-rose/25 bg-accent-rose/[0.06] p-4 text-sm">
          <p className="font-medium text-accent-rose">{errorMessage}</p>
          <p className="mt-1 text-fg-muted">
            You can also reach us directly at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-accent-2 underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {status === "sending" ? "Sending…" : "Send report"}
      </button>
    </form>
  );
}
