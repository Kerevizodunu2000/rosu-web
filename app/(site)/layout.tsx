// SPDX-License-Identifier: GPL-3.0-or-later
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Public marketing chrome (nav + footer) for the landing page and /report.
// /admin lives outside this route group and deliberately renders without it.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a
        href="#main"
        className="btn btn-secondary sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60]"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
