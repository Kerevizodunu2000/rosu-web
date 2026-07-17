// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, GITHUB_URL, PRIVACY_PATH } from "@/lib/links";

export const metadata: Metadata = {
  title: "Terms — Rosu",
  description:
    "The short, plain terms for using Rosu and the rosu-web site: provided as-is, GPL-3.0, unofficial and non-commercial. English + Türkçe.",
};

const LAST_UPDATED = "2026-07-18";

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          <span className="text-gradient-accent">Terms</span>
        </h1>
        <p className="mt-3 text-fg-muted">
          The short version. This page is available in English and Türkçe.
        </p>
        <nav aria-label="Languages" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a href="#english" className="font-medium text-accent-2 hover:underline underline-offset-4">
            English
          </a>
          <a href="#turkce" className="font-medium text-accent-2 hover:underline underline-offset-4">
            Türkçe
          </a>
        </nav>
      </div>

      <article id="english" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold tracking-tight text-fg">English</h2>
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-fg-muted">
          Last updated: {LAST_UPDATED}
        </p>
        <ul className="mt-6 flex flex-col gap-3 leading-relaxed text-fg-muted">
          <li>
            <strong className="text-fg">As-is, no warranty.</strong> Rosu and this website are
            provided free of charge, &ldquo;as is&rdquo; and without warranty of any kind. You use
            them at your own risk; to the extent permitted by law, the maintainer isn&apos;t liable
            for any loss or damage arising from their use.
          </li>
          <li>
            <strong className="text-fg">Open source (GPL-3.0).</strong> Rosu is free software under
            the GNU General Public License v3.0-or-later. The source is public on{" "}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-accent-2 underline underline-offset-2">
              GitHub
            </a>
            . Your rights to use, study, share, and modify it come from that license.
          </li>
          <li>
            <strong className="text-fg">Unofficial &amp; non-commercial.</strong> Rosu is an
            unofficial, fan-made, donation-only project — <strong className="text-fg">not affiliated
            with or endorsed by ppy Pty Ltd or osu!</strong>. &ldquo;osu!&rdquo; is used only to
            describe what the tool works with.
          </li>
          <li>
            <strong className="text-fg">The report form.</strong> Please send only your own
            information and don&apos;t submit unlawful, abusive, or infringing content. What we do
            with a report is described in our{" "}
            <Link href={PRIVACY_PATH} className="text-accent-2 underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </li>
          <li>
            <strong className="text-fg">Abuse &amp; IP concerns.</strong> To report abuse or a
            copyright/IP concern, email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-2 underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </li>
        </ul>
      </article>

      <hr className="mt-14 border-border" />

      <article id="turkce" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-semibold tracking-tight text-fg">Türkçe</h2>
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-fg-muted">
          Son güncelleme: {LAST_UPDATED}
        </p>
        <ul className="mt-6 flex flex-col gap-3 leading-relaxed text-fg-muted">
          <li>
            <strong className="text-fg">Olduğu gibi, garantisiz.</strong> Rosu ve bu web sitesi
            ücretsiz olarak, &ldquo;olduğu gibi&rdquo; ve hiçbir garanti verilmeksizin sunulur.
            Kullanım riski sana aittir; yasaların izin verdiği ölçüde, geliştirici kullanımından doğan
            herhangi bir zarardan sorumlu değildir.
          </li>
          <li>
            <strong className="text-fg">Açık kaynak (GPL-3.0).</strong> Rosu, GNU Genel Kamu Lisansı
            v3.0-veya-sonrası kapsamında özgür bir yazılımdır. Kaynak kodu{" "}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-accent-2 underline underline-offset-2">
              GitHub
            </a>
            &apos;da herkese açıktır. Kullanma, inceleme, paylaşma ve değiştirme hakların bu lisanstan
            gelir.
          </li>
          <li>
            <strong className="text-fg">Resmî değil &amp; ticari değil.</strong> Rosu; resmî olmayan,
            hayran yapımı, yalnızca bağışa dayalı bir projedir —{" "}
            <strong className="text-fg">ppy Pty Ltd veya osu! ile bağlantılı ya da onaylı değildir</strong>.
            &ldquo;osu!&rdquo; adı yalnızca aracın neyle çalıştığını tanımlamak için kullanılır.
          </li>
          <li>
            <strong className="text-fg">Rapor formu.</strong> Lütfen yalnızca kendine ait bilgileri
            gönder ve hukuka aykırı, kötüye kullanan veya hak ihlali içeren içerik gönderme. Bir
            raporla ne yaptığımız{" "}
            <Link href={PRIVACY_PATH} className="text-accent-2 underline underline-offset-2">
              Gizlilik Politikası
            </Link>
            &apos;nda açıklanır.
          </li>
          <li>
            <strong className="text-fg">Kötüye kullanım &amp; fikrî mülkiyet.</strong> Kötüye
            kullanımı veya bir telif/fikrî mülkiyet endişesini bildirmek için{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-2 underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>{" "}
            adresine e-posta gönder.
          </li>
        </ul>
      </article>

      <p className="mt-14 border-t border-border pt-8 text-sm text-fg-muted">
        <Link href="/" className="text-accent-2 hover:underline underline-offset-4">
          ← Back to home
        </Link>
      </p>
    </section>
  );
}
