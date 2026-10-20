// SPDX-License-Identifier: GPL-3.0-or-later
import { test, expect } from 'vitest'
import { pingUrl, ping } from '@/lib/watchdog'

test('only https ping URLs are used', () => {
  expect(pingUrl(undefined)).toBeNull()
  expect(pingUrl('http://hc-ping.com/abc')).toBeNull()
  expect(pingUrl('not a url')).toBeNull()
  expect(pingUrl('https://hc-ping.com/abc/')).toBe('https://hc-ping.com/abc')
})

test('success pings the URL, failure pings /fail, errors are swallowed', async () => {
  const hits: string[] = []
  const f = (async (u: unknown) => { hits.push(String(u)); return new Response('OK') }) as typeof fetch
  expect(await ping('https://hc-ping.com/abc', 'success', '', f)).toBe(true)
  expect(await ping('https://hc-ping.com/abc', 'fail', 'boom', f)).toBe(true)
  expect(hits).toEqual(['https://hc-ping.com/abc', 'https://hc-ping.com/abc/fail'])
  expect(await ping(null, 'success', '', f)).toBe(false)
  const boom = (async () => { throw new Error('net') }) as typeof fetch
  expect(await ping('https://hc-ping.com/abc', 'success', '', boom)).toBe(false)
})
