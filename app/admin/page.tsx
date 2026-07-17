// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { getSql, listRecentUnarchived } from "@/lib/db";
import LoginForm from "./login-form";
import AdminTable from "@/components/AdminTable";

export const metadata: Metadata = {
  title: "Admin — Rosu",
  robots: { index: false, follow: false },
};

// Deliberately minimal, private chrome — no marketing nav, no download CTA.
// This is a tool, not a page in the site; it signals that difference on sight.
function AdminChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2.5 px-5 sm:px-8">
          <span aria-hidden className="h-2 w-2 rounded-full bg-accent-2" />
          <span className="font-mono text-sm font-semibold tracking-tight text-fg">
            rosu<span className="text-fg-muted">/admin</span>
          </span>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default async function AdminPage() {
  // Reading cookies() makes this route dynamic — never statically cached.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const authed = await verifySession(token, process.env.ADMIN_SESSION_SECRET!);

  if (!authed) {
    // No DB access on this path: the page must render with no DATABASE_URL
    // and no session present (e.g. plain local dev).
    return (
      <AdminChrome>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-20">
          <LoginForm />
        </div>
      </AdminChrome>
    );
  }

  const reports = await listRecentUnarchived(getSql(), 100);

  return (
    <AdminChrome>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <AdminTable reports={reports} />
      </div>
    </AdminChrome>
  );
}
