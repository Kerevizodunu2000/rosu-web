// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import ReportForm from "@/components/ReportForm";
import Disclosure from "@/components/Disclosure";

export const metadata: Metadata = {
  title: "Report a problem — Rosu",
  description:
    "Ran into a bug or have feedback about Rosu? Send a quick report — a screenshot is welcome, no account needed.",
};

export default function ReportPage() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          Report a <span className="text-gradient-accent">problem</span>
        </h1>
        <p className="mt-3 text-fg-muted">
          Ran into a bug, or something feels off? Tell us what happened — a real person reads every
          report, and we&apos;ll reply if you leave a contact email.
        </p>
      </div>

      <div className="card mt-10 p-6 sm:p-8">
        <ReportForm />
      </div>

      <Disclosure className="mt-6" />
    </section>
  );
}
