// SPDX-License-Identifier: GPL-3.0-or-later
// Read-only admin panels (server-rendered): crash groups, the audit log, and a
// security summary. Nothing here needs client state.
import type { AuditRow, CrashGroup } from "@/lib/db";

function when(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function CheckRow({ label, ok, text }: { label: string; ok: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`} />
      <span><span className="font-medium text-fg">{label}:</span> {text}</span>
    </li>
  );
}

export function SecurityPanel({ totpEnabled, secretPath, liveSessions }: {
  totpEnabled: boolean; secretPath: boolean; liveSessions: number
}) {
  return (
    <Panel title="Security">
      <ul className="card flex flex-col gap-2 p-5 text-sm text-fg-muted">
        <CheckRow label="Two-factor sign-in" ok={totpEnabled}
          text={totpEnabled ? "on (authenticator code required)" : "off — set ADMIN_TOTP_SECRET (see README) to require a code"} />
        <CheckRow label="Admin path" ok={secretPath}
          text={secretPath ? "secret path in use; /admin answers 404" : "default /admin — set ADMIN_PATH to hide it"} />
        <CheckRow label="Active sessions" ok={liveSessions <= 1}
          text={`${liveSessions} (idle timeout 2 h, absolute 12 h, rotated every 15 min)`} />
      </ul>
    </Panel>
  );
}

export function CrashPanel({ crashes }: { crashes: CrashGroup[] }) {
  return (
    <Panel title="Crash reports" subtitle="Opt-in fingerprints from the desktop app, grouped by exception + stack.">
      {crashes.length === 0 ? (
        <p className="card px-5 py-8 text-center text-sm text-fg-muted">No crash reports.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-fg-muted">
                <th className="py-3 pl-4 pr-3 font-medium">Crash</th>
                <th className="px-3 py-3 font-medium">Users</th>
                <th className="px-3 py-3 font-medium">Hits</th>
                <th className="px-3 py-3 font-medium">Latest version</th>
                <th className="py-3 pl-3 pr-4 font-medium">Seen</th>
              </tr>
            </thead>
            <tbody>
              {crashes.map((c) => (
                <tr key={c.fingerprint} className="border-b border-border/70 align-top last:border-b-0">
                  <td className="py-3 pl-4 pr-3">
                    <p className="font-mono text-xs font-semibold text-fg">{c.exc_type}</p>
                    {c.message && <p className="mt-1 max-w-xl text-xs text-fg-muted">{c.message}</p>}
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-xs text-accent-2">Stack ({c.frames.split("\n").length} frames)</summary>
                      <pre className="mt-1.5 max-w-xl overflow-x-auto whitespace-pre font-mono text-[11px] leading-relaxed text-fg-muted">{c.frames}</pre>
                    </details>
                    <p className="mt-1 font-mono text-[10px] text-fg-muted/70">{c.fingerprint}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs tabular-nums text-fg">{c.users}</td>
                  <td className="px-3 py-3 font-mono text-xs tabular-nums text-fg-muted">{c.hits}</td>
                  <td className="px-3 py-3 font-mono text-xs text-fg-muted">{c.last_version || "—"}</td>
                  <td className="py-3 pl-3 pr-4 text-xs text-fg-muted">
                    <div>first {when(c.first_seen)}</div>
                    <div>last {when(c.last_seen)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

const EVENT_LABELS: Record<AuditRow["event"], string> = {
  login_ok: "Signed in",
  login_fail: "Failed sign-in",
  logout: "Signed out",
  logout_all: "Signed out everywhere",
  archive: "Archive run",
  status_change: "Status changed",
  maintenance: "Retention sweep",
};

export function AuditPanel({ events }: { events: AuditRow[] }) {
  return (
    <Panel title="Activity log" subtitle="Admin sign-ins and actions (IP addresses are stored only as salted hashes).">
      {events.length === 0 ? (
        <p className="card px-5 py-8 text-center text-sm text-fg-muted">Nothing logged yet.</p>
      ) : (
        <ol className="card divide-y divide-border/70 text-sm">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5">
              <time dateTime={e.at} className="font-mono text-xs tabular-nums text-fg-muted">{when(e.at)}</time>
              <span className={e.event === "login_fail" ? "font-medium text-accent-rose" : "font-medium text-fg"}>
                {EVENT_LABELS[e.event] ?? e.event}
              </span>
              {e.detail && <span className="text-xs text-fg-muted">{e.detail}</span>}
              {e.ip_hash && <span className="font-mono text-[10px] text-fg-muted/70">ip#{e.ip_hash.slice(0, 8)}</span>}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
