// SPDX-License-Identifier: GPL-3.0-or-later
import ReportForm from "@/components/ReportForm";
import Disclosure from "@/components/Disclosure";
import Rich from "@/components/Rich";
import AccentHeading from "@/components/AccentHeading";
import { ackConfig } from "@/lib/email";
import type { Locale } from "@/lib/i18n";
import { dict } from "@/content/i18n";

export default function ReportView({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const r = t.report;
  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="max-w-xl">
        <AccentHeading template={r.heading} accent={r.accent} />
        <p className="mt-3 text-fg-muted">{r.intro}</p>
      </div>

      <div className="card mt-10 p-6 sm:p-8">
        <ReportForm ackEmailAvailable={ackConfig() !== null} t={t.form} locale={locale} />
      </div>

      <Disclosure className="mt-6" t={t.disclosure} />

      <p className="mt-4 text-sm text-fg-muted"><Rich text={r.privacyLine} locale={locale} /></p>
    </section>
  );
}
