// SPDX-License-Identifier: GPL-3.0-or-later
import SiteChrome from "@/components/SiteChrome";

// English pages live at the bare paths; other languages under app/(intl)/[lang].
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome locale="en">{children}</SiteChrome>;
}
