// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "sending" | "error";

function friendlyError(status: number, data: { error?: string; retry_after?: number } | null, totp: boolean): string {
  if (status === 401) return totp ? "Wrong password or code." : "Wrong password.";
  if (status === 429 && data?.error === "locked" && data.retry_after) {
    const s = data.retry_after;
    return `Too many failed attempts — wait ${s >= 90 ? `${Math.ceil(s / 60)} minutes` : `${s} seconds`}.`;
  }
  if (status === 429) return "Too many attempts — try again later.";
  return "Something went wrong — please try again.";
}

export default function LoginForm({ apiBase, totpRequired }: { apiBase: string; totpRequired: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending" || !password || (totpRequired && code.length !== 6)) return;

    setStatus("sending");
    setErrorMessage(null);

    try {
      const res = await fetch(`${apiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; retry_after?: number } | null;

      if (res.ok && data?.ok) {
        // Server set the session cookie; re-render the (server) page so it
        // picks up the new cookie and swaps to the authed table.
        router.refresh();
        return;
      }

      setErrorMessage(friendlyError(res.status, data, totpRequired));
      setCode("");
      setStatus("error");
    } catch {
      setErrorMessage(friendlyError(0, null, totpRequired));
      setStatus("error");
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight text-fg">Admin sign-in</h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        {totpRequired
          ? "Enter the admin password and the 6-digit code from your authenticator app."
          : "Enter the admin password to view submissions."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status === "sending"}
            className="field-input mt-1.5"
          />
        </div>

        {totpRequired && (
          <div>
            <label htmlFor="code" className="field-label">
              Authenticator code
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={status === "sending"}
              className="field-input mt-1.5 font-mono tracking-[0.3em]"
            />
          </div>
        )}

        {errorMessage && (
          <p className="field-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending" || !password || (totpRequired && code.length !== 6)}
          className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
