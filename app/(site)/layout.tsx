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
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
