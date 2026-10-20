// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import Link from "next/link";
import { dbHealth } from "@/lib/health";
import { latestReleaseCached } from "@/lib/releases";

export const metadata: Metadata = {
  title: "Status — Rosu",
  description: "Is the Rosu site and its report service up right now?",
};
export const dynamic = "force-dynamic";

function Row({ label, ok, text }: { label: string; ok: boolean; text: string }) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="font-medium text-fg">{label}</span>
      <span className="flex items-center gap-2 text-sm text-fg-muted">
        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`} />
        {text}
      </span>
    </li>
  );
}

export default async function StatusPage() {
  const [db, latest] = await Promise.all([dbHealth(), latestReleaseCached().catch(() => null)]);
  const allOk = db === "ok" && latest !== null;
  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        Sta<span className="text-gradient-accent">tus</span>
      </h1>
      <p className="mt-3 text-fg-muted">
        {allOk ? "Everything is working." : "Something is not answering right now — reports may be delayed."}
      </p>
      <ul className="card mt-8 divide-y divide-border">
        <Row label="Website" ok text="Operational" />
        <Row label="Bug reports (in-app and web form)" ok={db === "ok"} text={db === "ok" ? "Operational" : "Degraded"} />
        <Row label="Update check" ok={latest !== null}
          text={latest ? `Operational · latest ${latest.tag}` : "Degraded"} />
      </ul>
      <p className="mt-6 text-sm text-fg-muted">
        Checked when this page loaded. If reporting is down you can always write to the address in the footer, or use{" "}
        <Link href="/report" className="text-accent-2 underline underline-offset-2">the report form</Link> later.
      </p>
    </section>
  );
}
