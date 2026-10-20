// SPDX-License-Identifier: GPL-3.0-or-later
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lookupAdmin } from "@/lib/adminGuard";
import { adminApiBase, adminPageBase, adminSlug } from "@/lib/adminPath";
import { listRecentUnarchived, listRecentAll, listAudit, listCrashGroups, countLiveAdminSessions } from "@/lib/db";
import LoginForm from "./login-form";
import AdminTable from "@/components/AdminTable";
import { AuditPanel, CrashPanel, SecurityPanel } from "@/components/AdminPanels";

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

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const slug = adminSlug();
  const apiBase = adminApiBase(slug);
  const pageBase = adminPageBase(slug);
  const totpEnabled = Boolean(process.env.ADMIN_TOTP_SECRET);

  // Reading cookies()/headers() (inside lookupAdmin) makes this route dynamic — never statically cached.
  const admin = await lookupAdmin();
  if (!admin.ok && admin.reason === "hidden") notFound();
  if (!admin.ok) {
    return (
      <AdminChrome>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-20">
          {admin.reason === "error" && (
            <p className="field-error mb-4" role="alert">
              The database is unreachable right now — sign-in may fail until it is back.
            </p>
          )}
          <LoginForm apiBase={apiBase} totpRequired={totpEnabled} />
        </div>
      </AdminChrome>
    );
  }

  const view = (await searchParams).view === "all" ? "all" : "unarchived";
  const [reports, audit, crashes, liveSessions] = await Promise.all([
    view === "all" ? listRecentAll(admin.sql, 100) : listRecentUnarchived(admin.sql, 100),
    listAudit(admin.sql, 40),
    listCrashGroups(admin.sql, 50),
    countLiveAdminSessions(admin.sql),
  ]);

  return (
    <AdminChrome>
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-5 py-8 sm:px-8">
        <AdminTable reports={reports} apiBase={apiBase} view={view} pageBase={pageBase} />
        <CrashPanel crashes={crashes} />
        <div className="grid gap-12 lg:grid-cols-2">
          <AuditPanel events={audit} />
          <SecurityPanel totpEnabled={totpEnabled} secretPath={slug !== null} liveSessions={liveSessions} />
        </div>
      </div>
    </AdminChrome>
  );
}
