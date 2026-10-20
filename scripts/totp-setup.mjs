// SPDX-License-Identifier: GPL-3.0-or-later
// One-time setup for admin two-factor sign-in.
//
//   node scripts/totp-setup.mjs
//
// Prints a fresh random secret and an otpauth:// link. Add the secret to your
// authenticator app (Google Authenticator, Aegis, 1Password, …: "enter a setup
// key", time-based, 6 digits), then store the same value as ADMIN_TOTP_SECRET in
// the Vercel environment and redeploy. Nothing is sent anywhere.
import { randomBytes } from 'node:crypto'

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function base32(bytes) {
  let bits = 0, value = 0, out = ''
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

const secret = base32(randomBytes(20)) // 160 bits, the RFC 4226 recommendation
const label = encodeURIComponent('Rosu admin')
const uri = `otpauth://totp/${label}?secret=${secret}&issuer=Rosu&algorithm=SHA1&digits=6&period=30`

console.log('ADMIN_TOTP_SECRET=' + secret)
console.log('')
console.log('Authenticator setup key: ' + secret.match(/.{1,4}/g).join(' '))
console.log('otpauth link:            ' + uri)
console.log('')
console.log('Keep this secret private. Anyone with it (and the admin password) can sign in.')
