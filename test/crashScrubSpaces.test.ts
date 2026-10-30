// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { scrubText, parseCrash } from '@/lib/crash'

const crash = (message: string) => ({ exc_type: 'OSError', message, frames: ['rosu/app.py:main'], app_version: '1', os: 'x', token: 't' })

test('user names with spaces are removed with the whole path', () => {
  expect(scrubText('No such file: C:\\Users\\John Smith\\osu!\\Songs\\x.osz')).toBe('No such file: <path>')
  expect(scrubText('C:/Users/John Smith/x.db failed')).toBe('<path> failed')
  expect(scrubText("open '/home/john smith/.config/rosu/x'")).toBe("open '<path>'")
  expect(scrubText('at /Users/Jane Doe/Library/x.db')).toBe('at <path>')
})

test('parseCrash keeps no part of a spaced user name', () => {
  const r = parseCrash(crash('cannot read C:\\Users\\Ann Lee\\x'))
  expect(r.ok).toBe(true)
  if (r.ok) { expect(r.value.message).not.toMatch(/Ann|Lee/) }
})

test('hostile input stays fast', () => {
  const message = 'C:\\Users\\a b/home/ '.repeat(1100).slice(0, 20_000)
  const t = performance.now()
  expect(parseCrash(crash(message)).ok).toBe(true)
  expect(scrubText(message)).not.toContain('a b')
  expect(performance.now() - t).toBeLessThan(100)
})
