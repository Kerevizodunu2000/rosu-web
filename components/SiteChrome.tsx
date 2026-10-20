// SPDX-License-Identifier: GPL-3.0-or-later
import Nav from "./Nav";
import Footer from "./Footer";
import HtmlLang from "./HtmlLang";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { dict } from "@/content/i18n";

// Public marketing chrome (nav + footer) for every site page, in one language.
// /admin lives outside this and deliberately renders without it.
export default function SiteChrome({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = dict(locale);
  return (
    // display: contents keeps the body's flex column; lang marks the language.
    <div lang={locale} className="contents">
      {locale !== DEFAULT_LOCALE && <HtmlLang lang={locale} />}
      <a
        href="#main"
        className="btn btn-secondary sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60]"
      >
        {t.common.skip}
      </a>
      <Nav locale={locale} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
