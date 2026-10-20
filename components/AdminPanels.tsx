// SPDX-License-Identifier: GPL-3.0-or-later
// Read-only admin panels (server-rendered): statistics, crash groups, the
// audit log, and a security summary. Nothing here needs client state.
import type { AuditRow, CrashGroup, ReportStatsRaw } from "@/lib/db";
import { fillSeries, niceMax, type Bucket } from "@/lib/stats";
import { STATUS_LABELS } from "@/lib/reportStatus";

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
  dsar_delete: "Report deleted (data request)",
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

// ── statistics (v1.5) ─────────────────────────────────────────────────────────

const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact" }).format(n);

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="card flex flex-col gap-1 px-5 py-4">
      <span className="text-xs font-medium text-fg-muted">{label}</span>
      <span className="text-2xl font-semibold tabular-nums tracking-tight text-fg">{compact(value)}</span>
    </div>
  );
}

/**
 * A single-series column chart: thin columns (≤24px) with a 4px rounded top
 * on one baseline, a recessive hairline axis, only the peak labelled, and a
 * native tooltip on a hit area wider than the column. The numbers are also in
 * the table under the chart.
 */
function ColumnChart({ title, series, label }: { title: string; series: Bucket[]; label: (key: string) => string }) {
  const W = 560, H = 150, top = 20, bottom = 22
  const max = niceMax(Math.max(0, ...series.map((b) => b.n)))
  const slot = W / series.length
  const barW = Math.min(24, slot - 2)
  const plotH = H - top - bottom
  const peak = series.reduce((best, b, i) => (b.n > series[best].n ? i : best), 0)
  return (
    <figure className="card flex flex-col gap-2 px-5 py-4">
      <figcaption className="text-sm font-medium text-fg">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
        <line x1={0} x2={W} y1={H - bottom + 0.5} y2={H - bottom + 0.5} stroke="var(--border)" strokeWidth={1} />
        {series.map((b, i) => {
          const h = b.n ? Math.max(2, (b.n / max) * plotH) : 0
          const x = i * slot + (slot - barW) / 2
          const y = H - bottom - h
          const r = Math.min(4, h, barW / 2)
          const d = `M${x},${H - bottom} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${H - bottom} Z`
          return (
            <g key={b.key}>
              <title>{`${label(b.key)}: ${b.n}`}</title>
              <rect x={i * slot} y={top} width={slot} height={plotH} fill="transparent" />
              {h > 0 && <path d={d} fill="var(--chart-mark)" />}
              {i === peak && b.n > 0 && (
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="fill-fg text-[11px] tabular-nums">{b.n}</text>
              )}
            </g>
          )
        })}
        <text x={0} y={H - 6} className="fill-fg-muted text-[11px]">{label(series[0].key)}</text>
        <text x={W} y={H - 6} textAnchor="end" className="fill-fg-muted text-[11px]">{label(series[series.length - 1].key)}</text>
      </svg>
      <details className="text-xs text-fg-muted">
        <summary className="cursor-pointer">Show as a table</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <tbody>
            {series.map((b) => (
              <tr key={b.key}><td className="py-0.5 pr-4">{label(b.key)}</td><td className="py-0.5 text-fg">{b.n}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

const dayLabel = (key: string) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function StatsPanel({ stats, now = new Date() }: { stats: ReportStatsRaw; now?: Date }) {
  const s = stats.byStatus;
  const total = s.received + s.in_review + s.fixed + s.closed;
  const weeks = fillSeries(stats.perWeek, "week", 12, now);
  const days = fillSeries(stats.crashesPerDay, "day", 14, now);
  const crashes = days.reduce((a, b) => a + b.n, 0);
  const vmax = Math.max(1, ...stats.versions.map((v) => v.n));
  return (
    <Panel title="Statistics" subtitle={`${stats.bySource.app} from the app · ${stats.bySource.web} from the web form`}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Reports" value={total} />
        <StatTile label="Open (received or in review)" value={s.received + s.in_review} />
        <StatTile label={STATUS_LABELS.fixed} value={s.fixed} />
        <StatTile label="Crash reports, last 14 days" value={crashes} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <ColumnChart title="Reports per week (12 weeks, by week start)" series={weeks} label={(k) => `w/c ${dayLabel(k)}`} />
        <ColumnChart title="Crash reports per day (14 days)" series={days} label={dayLabel} />
      </div>
      {stats.versions.length > 0 && (
        <div className="card flex flex-col gap-2 px-5 py-4">
          <p className="text-sm font-medium text-fg">Reports by app version (top {stats.versions.length})</p>
          <ul className="flex flex-col gap-1.5 text-xs">
            {stats.versions.map((v) => (
              <li key={v.version} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-3">
                <span className="truncate font-mono text-fg-muted" title={v.version}>{v.version}</span>
                <span className="h-2.5 rounded-r-[4px] bg-[var(--chart-mark)]" style={{ width: `${(v.n / vmax) * 100}%` }} />
                <span className="text-right tabular-nums text-fg">{v.n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
