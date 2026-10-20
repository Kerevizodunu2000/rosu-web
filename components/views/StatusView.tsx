// SPDX-License-Identifier: GPL-3.0-or-later
import Rich from "@/components/Rich";
import { dbHealth } from "@/lib/health";
import { latestReleaseCached } from "@/lib/releases";
import type { Locale } from "@/lib/i18n";
import { dict, fmt } from "@/content/i18n";

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

export default async function StatusView({ locale }: { locale: Locale }) {
  const t = dict(locale).status;
  const [db, latest] = await Promise.all([dbHealth(), latestReleaseCached().catch(() => null)]);
  const allOk = db === "ok" && latest !== null;
  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        <span className="text-gradient-accent">{t.title}</span>
      </h1>
      <p className="mt-3 text-fg-muted">{allOk ? t.allOk : t.notOk}</p>
      <ul className="card mt-8 divide-y divide-border">
        <Row label={t.website} ok text={t.operational} />
        <Row label={t.reports} ok={db === "ok"} text={db === "ok" ? t.operational : t.degraded} />
        <Row label={t.updates} ok={latest !== null} text={latest ? fmt(t.latest, { tag: latest.tag }) : t.degraded} />
      </ul>
      <p className="mt-6 text-sm text-fg-muted"><Rich text={t.checked} locale={locale} /></p>
    </section>
  );
}
