// SPDX-License-Identifier: GPL-3.0-or-later
// A deliberately small Markdown subset for release notes, the devlog and docs:
// headings, paragraphs, lists, blockquotes, fenced code, rules, and inline
// **bold**, *italic*, `code` and [links](url). It parses to plain data that a
// React component renders — there is no HTML pass-through anywhere, so text
// from GitHub release notes can never inject markup or script.

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'code'; v: string }
  | { t: 'strong'; c: Inline[] }
  | { t: 'em'; c: Inline[] }
  | { t: 'link'; href: string; c: Inline[] }

export type Block =
  | { t: 'h'; level: 1 | 2 | 3 | 4; c: Inline[]; id: string }
  | { t: 'p'; c: Inline[] }
  | { t: 'ul'; items: Inline[][] }
  | { t: 'ol'; items: Inline[][] }
  | { t: 'quote'; c: Inline[] }
  | { t: 'code'; lang: string; v: string }
  | { t: 'hr' }

/** Only http(s) and site-relative links survive; anything else renders as text. */
export function safeHref(url: string): string | null {
  const u = url.trim()
  if (/^https?:\/\/[^\s<>"']+$/i.test(u)) return u
  if (/^\/(?!\/)[^\s<>"']*$/.test(u) || /^#[\w-]+$/.test(u)) return u
  return null
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[`*_[\]()]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function plain(nodes: Inline[]): string {
  return nodes.map((n) => (n.t === 'text' || n.t === 'code' ? n.v : plain(n.c))).join('')
}

/** Inline markup → nodes. Unmatched markers stay literal text. */
export function parseInline(src: string): Inline[] {
  const out: Inline[] = []
  let buf = ''
  const flush = () => { if (buf) { out.push({ t: 'text', v: buf }); buf = '' } }
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (ch === '\\' && i + 1 < src.length && /[\\`*_[\]()#>-]/.test(src[i + 1])) {
      buf += src[i + 1]; i += 2; continue
    }
    if (ch === '`') {
      const end = src.indexOf('`', i + 1)
      if (end > i) { flush(); out.push({ t: 'code', v: src.slice(i + 1, end) }); i = end + 1; continue }
    }
    if (src.startsWith('**', i) || src.startsWith('__', i)) {
      const mark = src.slice(i, i + 2)
      const end = src.indexOf(mark, i + 2)
      if (end > i + 2) { flush(); out.push({ t: 'strong', c: parseInline(src.slice(i + 2, end)) }); i = end + 2; continue }
    }
    if ((ch === '*' || ch === '_') && src[i + 1] && src[i + 1] !== ' ') {
      const end = src.indexOf(ch, i + 1)
      const wordEdge = ch === '*' || i === 0 || /\W/.test(src[i - 1])
      if (end > i + 1 && wordEdge && src[end - 1] !== ' ') {
        flush(); out.push({ t: 'em', c: parseInline(src.slice(i + 1, end)) }); i = end + 1; continue
      }
    }
    if (ch === '[') {
      const close = src.indexOf('](', i + 1)
      const paren = close > i ? src.indexOf(')', close + 2) : -1
      if (close > i && paren > close) {
        const href = safeHref(src.slice(close + 2, paren))
        const label = parseInline(src.slice(i + 1, close))
        flush()
        if (href) out.push({ t: 'link', href, c: label })
        else out.push(...label)
        i = paren + 1
        continue
      }
    }
    buf += ch
    i++
  }
  flush()
  return out
}

/** Block structure. Unknown constructs degrade to paragraphs of text. */
export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  const endPara = () => {
    if (para.length) { blocks.push({ t: 'p', c: parseInline(para.join(' ')) }); para = [] }
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fence = /^```\s*([\w-]*)\s*$/.exec(line)
    if (fence) {
      endPara()
      const body: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++])
      blocks.push({ t: 'code', lang: fence[1], v: body.join('\n') })
      continue
    }
    const h = /^(#{1,4})\s+(.*?)\s*#*\s*$/.exec(line)
    if (h) {
      endPara()
      const c = parseInline(h[2])
      blocks.push({ t: 'h', level: h[1].length as 1 | 2 | 3 | 4, c, id: slugify(plain(c)) })
      continue
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { endPara(); blocks.push({ t: 'hr' }); continue }
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      endPara()
      const ordered = /^\s*\d+[.)]\s+/.test(line)
      const itemRe = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/
      const items: string[] = []
      while (i < lines.length) {
        const m = itemRe.exec(lines[i])
        if (m) { items.push(m[1]); i++; continue }
        // An indented continuation line belongs to the previous item.
        if (items.length && /^\s{2,}\S/.test(lines[i])) { items[items.length - 1] += ' ' + lines[i].trim(); i++; continue }
        break
      }
      i--
      blocks.push(ordered ? { t: 'ol', items: items.map(parseInline) } : { t: 'ul', items: items.map(parseInline) })
      continue
    }
    const q = /^\s*>\s?(.*)$/.exec(line)
    if (q) {
      endPara()
      const body = [q[1]]
      while (i + 1 < lines.length && /^\s*>\s?/.test(lines[i + 1])) body.push(lines[++i].replace(/^\s*>\s?/, ''))
      blocks.push({ t: 'quote', c: parseInline(body.join(' ')) })
      continue
    }
    if (!line.trim()) { endPara(); continue }
    para.push(line.trim())
  }
  endPara()
  return blocks
}
