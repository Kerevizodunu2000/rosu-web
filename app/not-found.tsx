// SPDX-License-Identifier: GPL-3.0-or-later
import Link from "next/link";
import Brand from "@/components/Brand";
import { LOCALES, localePath } from "@/lib/i18n";
import { dict } from "@/content/i18n";

// One 404 for every path: the address may not say which language it meant,
// so the page says it in all three.
export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-5 py-20">
      <Brand />
      {LOCALES.map((l) => {
        const t = dict(l).notFound;
        return (
          <section key={l} lang={l} className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-fg">{t.title}</h1>
            <p className="text-fg-muted">{t.text}</p>
            <Link href={localePath(l, "/")} className="text-sm font-medium text-accent-2 underline underline-offset-2">{t.home}</Link>
          </section>
        );
      })}
    </main>
  );
}
