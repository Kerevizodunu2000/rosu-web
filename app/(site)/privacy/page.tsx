// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Privacy Policy — Rosu",
  description:
    "How Rosu handles the data you send through the report/contact form: what's collected, why, where it's stored, how long, and how to have it deleted. English + Türkçe.",
};

// Keep this date in sync with the "Last updated" lines below when the policy changes.
const LAST_UPDATED = "2026-07-18";

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          Privacy <span className="text-gradient-accent">Policy</span>
        </h1>
        <p className="mt-3 text-fg-muted">
          What we collect through the report form, why, where it goes, and how to have it removed.
          This page is available in English and Türkçe.
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

      {/* ── English ─────────────────────────────────────────────── */}
      <article id="english" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold tracking-tight text-fg">English</h2>
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-fg-muted">
          Last updated: {LAST_UPDATED}
        </p>

        <p className="mt-6 leading-relaxed text-fg-muted">
          Rosu is a free, open-source (GPL-3.0), <strong className="text-fg">unofficial</strong>{" "}
          fan-made tool for managing osu! beatmap archives. It is{" "}
          <strong className="text-fg">not affiliated with or endorsed by ppy Pty Ltd / osu!</strong>.
          This policy covers the Rosu website and the optional in-app{" "}
          <Link href="/report" className="text-accent-2 underline underline-offset-2">
            &ldquo;Report a problem / contact&rdquo;
          </Link>{" "}
          form.
        </p>

        <PolicyBlock title="Who we are">
          Rosu is maintained by an individual developer. Contact:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-2 underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
          . We are the data controller for the reports you send.
        </PolicyBlock>

        <PolicyBlock title="What we collect">
          Only when you <em>choose</em> to send a report: the title and description you type, an
          optional contact email, an optional screenshot you attach, and basic diagnostics (the Rosu
          version, your operating system, and the app&apos;s interface language). On our server we
          store a <strong className="text-fg">salted, hashed</strong> form of your IP address to
          limit spam — we never store your raw IP. The web form uses Cloudflare Turnstile (an
          anti-spam check), which may set a cookie and process connection metadata.
        </PolicyBlock>

        <PolicyBlock title="Why (lawful basis)">
          Your report (title and description) and the diagnostics, together with the hashed IP, are
          processed under our <em>legitimate interest</em> in fixing bugs and preventing abuse. The
          optional contact email and screenshot are processed with your <em>consent</em> — you decide
          whether to include them, and you can withdraw that consent at any time by asking us to
          delete your report.
        </PolicyBlock>

        <PolicyBlock title="Where it goes">
          Reports are stored in a hosted database (Neon), and any screenshot is stored on the
          maintainer&apos;s private Google Drive; working copies are moved into periodic archives
          automatically. These providers (Neon, Google, Cloudflare, and our host Vercel) are based in
          the United States, so your data is processed outside your country — including outside the
          EU/EEA and Turkey — under those providers&apos; standard data-protection terms (such as the
          EU Standard Contractual Clauses). We don&apos;t sell your data, show ads, or use third-party
          analytics/tracking.
        </PolicyBlock>

        <PolicyBlock title="Retention">
          Reports and screenshots are moved into periodic archives on the maintainer&apos;s private
          Google Drive; working copies are removed once archived. We delete them on request (see
          below) and aim to remove archives older than <strong className="text-fg">12 months</strong>.
        </PolicyBlock>

        <PolicyBlock title="Your choices">
          You can ask us to access, correct, or delete a report you sent, to restrict or object to
          its processing, or to withdraw consent you gave — just email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-2 underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
          . If you&apos;re in the EU/EEA or the UK, you also have the right to lodge a complaint with
          your local data-protection authority; in Turkey you may complain to the Personal Data
          Protection Authority (KVKK).
        </PolicyBlock>

        <PolicyBlock title="Minors">
          Please don&apos;t submit other people&apos;s personal information. If you are under the age
          of digital consent in your country, ask a parent or guardian before sending a report. Only
          the title and description are required — everything else is optional.
        </PolicyBlock>

        <PolicyBlock title="Changes">
          We&apos;ll update this page and its date if any of this changes.
        </PolicyBlock>
      </article>

      <hr className="mt-14 border-border" />

      {/* ── Türkçe ──────────────────────────────────────────────── */}
      <article id="turkce" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-semibold tracking-tight text-fg">Türkçe</h2>
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-fg-muted">
          Son güncelleme: {LAST_UPDATED}
        </p>

        <p className="mt-6 leading-relaxed text-fg-muted">
          Rosu; osu! beatmap arşivlerini yöneten, ücretsiz, açık kaynak (GPL-3.0) ve{" "}
          <strong className="text-fg">resmî olmayan</strong>, hayran yapımı bir araçtır.{" "}
          <strong className="text-fg">
            ppy Pty Ltd / osu! ile bağlantılı veya onlar tarafından onaylanmış değildir.
          </strong>{" "}
          Bu politika, Rosu web sitesini ve uygulama içindeki isteğe bağlı{" "}
          <Link href="/report" className="text-accent-2 underline underline-offset-2">
            &ldquo;Sorun bildir / iletişim&rdquo;
          </Link>{" "}
          formunu kapsar.
        </p>

        <PolicyBlock title="Kim olduğumuz">
          Rosu, bireysel bir geliştirici tarafından sürdürülmektedir. İletişim:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-2 underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
          . Gönderdiğin raporlar için veri sorumlusu biziz.
        </PolicyBlock>

        <PolicyBlock title="Neleri topluyoruz">
          Yalnızca bir rapor göndermeyi <em>seçtiğinde</em>: yazdığın başlık ve açıklama, isteğe
          bağlı bir iletişim e-postası, isteğe bağlı olarak eklediğin bir ekran görüntüsü ve temel
          tanılama bilgileri (Rosu sürümü, işletim sistemin ve uygulamanın arayüz dili). Sunucumuzda,
          spam&apos;i sınırlamak için IP adresinin{" "}
          <strong className="text-fg">tuzlanmış (salted) ve hash&apos;lenmiş</strong> bir hâlini
          saklarız — ham IP adresini asla saklamayız. Web formu, Cloudflare Turnstile (spam-önleyici
          bir doğrulama) kullanır; bu, bir çerez ayarlayabilir ve bağlantı meta verilerini
          işleyebilir.
        </PolicyBlock>

        <PolicyBlock title="Neden (hukuki dayanak)">
          Raporun (başlık ve açıklama) ve tanılama bilgileri, hash&apos;lenmiş IP ile birlikte,
          hataları düzeltme ve kötüye kullanımı önleme yönündeki <em>meşru menfaatimiz</em> kapsamında
          işlenir. İsteğe bağlı iletişim e-postası ve ekran görüntüsü, <em>açık rızanla</em> işlenir —
          bunları eklemek senin tercihindir ve raporunun silinmesini isteyerek rızanı istediğin zaman
          geri çekebilirsin.
        </PolicyBlock>

        <PolicyBlock title="Nerede saklanır">
          Raporlar barındırılan bir veritabanında (Neon), ekran görüntüleri ise geliştiricinin özel
          Google Drive&apos;ında saklanır; çalışma kopyaları düzenli olarak otomatik arşivlere taşınır.
          Bu sağlayıcılar (Neon, Google, Cloudflare ve barındırıcımız Vercel) ABD merkezlidir; bu
          nedenle verilerin, bu sağlayıcıların standart veri koruma şartları (ör. AB Standart Sözleşme
          Hükümleri) kapsamında ülkenin dışında — AB/AEA ve Türkiye dışı dâhil — işlenir. Verilerini
          satmayız, reklam göstermeyiz, üçüncü taraf analiz/izleme kullanmayız.
        </PolicyBlock>

        <PolicyBlock title="Saklama süresi">
          Raporlar ve ekran görüntüleri, geliştiricinin özel Google Drive&apos;ındaki düzenli
          arşivlere taşınır; çalışma kopyaları arşivlendikten sonra silinir. Bunları talep üzerine
          sileriz (aşağıya bak) ve <strong className="text-fg">12 aydan</strong> eski arşivleri
          kaldırmayı hedefleriz.
        </PolicyBlock>

        <PolicyBlock title="Seçeneklerin">
          Gönderdiğin bir rapora erişmek, düzeltmek veya sildirmek, işlenmesini kısıtlamak ya da
          itiraz etmek veya verdiğin rızayı geri çekmek için{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-2 underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>{" "}
          adresine e-posta gönderebilirsin. AB/AEA veya Birleşik Krallık&apos;taysan yerel veri koruma
          otoritene şikâyette bulunma hakkın da vardır; Türkiye&apos;de Kişisel Verileri Koruma
          Kurumu&apos;na (KVKK) şikâyette bulunabilirsin.
        </PolicyBlock>

        <PolicyBlock title="Reşit olmayanlar">
          Lütfen başkalarının kişisel bilgilerini gönderme. Ülkende dijital rıza yaşının altındaysan,
          rapor göndermeden önce bir ebeveyn/veliye danış. Yalnızca başlık ve açıklama zorunludur —
          gerisi isteğe bağlıdır.
        </PolicyBlock>

        <PolicyBlock title="Değişiklikler">
          Bunlardan herhangi biri değişirse bu sayfayı ve tarihini güncelleriz.
        </PolicyBlock>
      </article>

      <p className="mt-14 border-t border-border pt-8 text-sm text-fg-muted">
        <Link href="/" className="text-accent-2 hover:underline underline-offset-4">
          ← Back to home
        </Link>
      </p>
    </section>
  );
}

function PolicyBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 leading-relaxed text-fg-muted">{children}</p>
    </div>
  );
}
