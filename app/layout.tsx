// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Rosu unpacks osu! beatmap packs, dedupes them into one tidy Library, and imports into osu!(stable) or lazer. Free, open-source (GPL-3.0), Windows.";
const SITE_TITLE = "Rosu — osu! beatmap-pack archive manager";

export const metadata: Metadata = {
  metadataBase: new URL("https://rosu-web.vercel.app"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Rosu",
  icons: { icon: "/rosu-mark.svg" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Rosu",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/screenshots/dashboard.png", width: 1278, height: 918, alt: "The Rosu dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/screenshots/dashboard.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
