// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Read a required environment variable, throwing a clear error if it's missing
 * or empty. Prevents silent misconfiguration — e.g. `process.env.IP_HASH_SALT!`
 * degrading to the literal string "undefined" and becoming a fixed, guessable
 * salt. Callers run inside request handlers wrapped in try/catch, so a missing
 * var surfaces as a clean 500 instead of poisoned data.
 */
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}
