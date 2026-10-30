// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, expect, it } from 'vitest'
import { mailtoHref } from '@/lib/validation'

describe('mailtoHref', () => {
  it('links a plain address', () => {
    expect(mailtoHref('a@b.co')).toBe('mailto:a@b.co')
  })
  it('rejects two @', () => {
    expect(mailtoHref('a@b.co?cc=x@y.z')).toBeNull()
  })
  it('encodes query-like suffixes', () => {
    expect(mailtoHref('a@b.co?subject=hi&body=x')).toBe('mailto:a@b.co%3Fsubject%3Dhi%26body%3Dx')
  })
  it('encodes # and %', () => {
    expect(mailtoHref('a#b@c.co')).toContain('%23')
    expect(mailtoHref('a%40@c.co')).toContain('%2540')
  })
  it('returns null for non-emails and empty', () => {
    expect(mailtoHref('discord: foo')).toBeNull()
    expect(mailtoHref('')).toBeNull()
  })
  it('never leaves a raw ? & = # or whitespace after mailto:', () => {
    for (const c of ['a@b.co', 'a@b.co?x=1&y=2', 'a#b@c.co', 'a%40@c.co', 'a/b:c@d.co/x?y#z', 'a=b@c.co&d=e']) {
      const h = mailtoHref(c)
      if (h) expect(h.slice('mailto:'.length)).not.toMatch(/[?&=#\s]/)
    }
  })
})
