// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * One-time Google Drive refresh-token minter for the rosu-web backend.
 *
 * Run this ONCE, locally, and sign in as rosu.app@gmail.com when the browser
 * opens. It prints a GOOGLE_REFRESH_TOKEN you paste into Vercel (and .env.local).
 * It reuses the desktop app's OAuth client and requests only the non-sensitive
 * `drive.file` scope (the backend can then read/write ONLY the files it creates).
 *
 * Node 18+ (uses the global fetch). No dependencies.
 *
 *   node scripts/mint-drive-token.mjs
 *
 * OAuth client is resolved from the first available of:
 *   1. env ROSU_OAUTH_CLIENT_JSON  (raw JSON of the client)
 *   2. env GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET
 *   3. a path passed as the first CLI argument
 *   4. C:/Desktop/rosu/rosu/drive/oauth_client.json  (the desktop app's client)
 *
 * IMPORTANT: the Google Cloud project's OAuth consent screen must be published
 * ("In production"), NOT "Testing" — a Testing-mode refresh token EXPIRES after
 * 7 days, which would break the backend weekly.
 */
import http from "node:http";
import crypto from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

const AUTH_URI = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URI = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

function parseClient(text) {
  const d = JSON.parse(text);
  const n = d.installed || d.web || d;
  if (!n.client_id || !n.client_secret)
    throw new Error("OAuth client JSON missing client_id/client_secret");
  return { id: n.client_id, secret: n.client_secret };
}
function loadClient() {
  if (process.env.ROSU_OAUTH_CLIENT_JSON)
    return parseClient(process.env.ROSU_OAUTH_CLIENT_JSON);
  if (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET)
    return { id: process.env.GOOGLE_OAUTH_CLIENT_ID, secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET };
  const candidates = [process.argv[2], "C:/Desktop/rosu/rosu/drive/oauth_client.json"].filter(Boolean);
  for (const p of candidates) {
    try { if (existsSync(p)) return parseClient(readFileSync(p, "utf8")); } catch { /* try next */ }
  }
  console.error("No OAuth client found. Set ROSU_OAUTH_CLIENT_JSON, or GOOGLE_OAUTH_CLIENT_ID/SECRET, or pass a path to oauth_client.json.");
  process.exit(1);
}

const b64url = (buf) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function openBrowser(url) {
  // On Windows, `cmd /c start <url>` splits the URL at the first `&`, so Google
  // only receives `client_id=…` and rejects it ("missing response_type").
  // rundll32's FileProtocolHandler is spawned directly (no shell), so the full
  // URL — ampersands and all — reaches the default browser intact.
  try {
    if (process.platform === "win32")
      spawn("rundll32", ["url.dll,FileProtocolHandler", url], { stdio: "ignore", detached: true }).unref();
    else if (process.platform === "darwin")
      spawn("open", [url], { stdio: "ignore", detached: true }).unref();
    else spawn("xdg-open", [url], { stdio: "ignore", detached: true }).unref();
  } catch { /* fall back to the printed URL — copy/paste it manually */ }
}

const { id, secret } = loadClient();
const verifier = b64url(crypto.randomBytes(64));
const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
const state = b64url(crypto.randomBytes(24));
let redirect = "";

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  if (!u.searchParams.has("code") && !u.searchParams.has("error")) {
    res.writeHead(204);
    res.end();
    return;
  }
  const ok = u.searchParams.get("state") === state && u.searchParams.has("code");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(
    `<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;text-align:center;padding:64px;color:#211f2b">` +
      `<h2 style="color:#ff2e97">${ok ? "Rosu — connected ✓" : "Sign-in failed"}</h2>` +
      `<p>You can close this tab and return to the terminal.</p></body>`,
  );
  if (!ok) {
    console.error("\nConsent failed:", u.searchParams.get("error") || "state mismatch");
    server.close();
    process.exit(1);
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: u.searchParams.get("code"),
    redirect_uri: redirect,
    client_id: id,
    client_secret: secret,
    code_verifier: verifier,
  });
  let data;
  try {
    const r = await fetch(TOKEN_URI, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    data = await r.json();
  } catch (e) {
    console.error("\nToken exchange failed:", e.message);
    server.close();
    process.exit(1);
  }
  server.close();
  if (!data.refresh_token) {
    console.error(
      "\nNo refresh_token returned:",
      data.error_description || data.error || JSON.stringify(data),
      "\n\nIf you have authorized before, revoke Rosu at https://myaccount.google.com/permissions and run this again.",
    );
    process.exit(1);
  }
  console.log("\n===== GOOGLE_REFRESH_TOKEN (copy this) =====\n");
  console.log(data.refresh_token);
  console.log("\n============================================");
  console.log("Paste it into Vercel env (GOOGLE_REFRESH_TOKEN) and .env.local.\n");
  process.exit(0);
});

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  redirect = `http://127.0.0.1:${port}/`;
  const authUrl =
    AUTH_URI +
    "?" +
    new URLSearchParams({
      client_id: id,
      redirect_uri: redirect,
      response_type: "code",
      scope: SCOPE,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
      access_type: "offline",
      prompt: "consent",
    });
  console.log("\nOpening your browser — sign in as rosu.app@gmail.com and click Allow.");
  console.log("If it does not open, paste this URL into your browser:\n\n" + authUrl + "\n");
  openBrowser(authUrl);
});
