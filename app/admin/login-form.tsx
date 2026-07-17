// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "sending" | "error";

function friendlyError(status: number): string {
  if (status === 401) return "Wrong password.";
  if (status === 429) return "Too many attempts — try again later.";
  return "Something went wrong — please try again.";
}

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending" || !password) return;

    setStatus("sending");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;

      if (res.ok && data?.ok) {
        // Server set the session cookie; re-render the (server) page so it
        // picks up the new cookie and swaps to the authed table.
        router.refresh();
        return;
      }

      setErrorMessage(friendlyError(res.status));
      setStatus("error");
    } catch {
      setErrorMessage(friendlyError(0));
      setStatus("error");
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-xl font-semibold tracking-tight text-fg">Admin sign-in</h1>
      <p className="mt-1.5 text-sm text-fg-muted">Enter the admin password to view submissions.</p>

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

        {errorMessage && (
          <p className="field-error" role="alert">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending" || !password}
          className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
