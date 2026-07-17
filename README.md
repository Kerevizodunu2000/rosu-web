# rosu-web

The website + report/contact backend for **[Rosu](https://github.com/Kerevizodunu2000/rosu)**
— a free, open-source osu! beatmap-pack archive manager for Windows.

**Two jobs:**
1. A small **landing page** for Rosu (what it is, features, a Download link).
2. A **bug-report / contact** system — a web form **and** an API endpoint the
   Rosu desktop app POSTs to. Submissions are stored in a free database;
   screenshots go to free blob storage; the owner reads them.

**Stack (planned):** Vercel + Next.js (App Router) + a free, no-pause database
(Neon Postgres or Turso). Everything free, no credit card, nothing that sleeps.

---

## 👉 Start with [`HANDOFF.md`](./HANDOFF.md)

`HANDOFF.md` is the complete brief: purpose, decision history, the exact
desktop-app request contract, the recommended stack, what to build, constraints,
and open questions for the owner. **Read it before writing any code.**

Prior (rejected) approach — a Google Apps Script backend — is kept for reference
under [`reference/apps-script/`](./reference/apps-script/).

## Status

Not yet scaffolded. See `HANDOFF.md` §11 for the first steps.

## Related

- Desktop app: <https://github.com/Kerevizodunu2000/rosu> (GPL-3.0, public)
- Contact: rosu.app@gmail.com
