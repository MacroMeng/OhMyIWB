/**
 * markdown-it 插件：将 `>!文字!<` 解析为「黑幕」（点击后才显示）
 *
 * 支持三种写法：
 *   - 段内：  这是一段 >!秘密!< 文本
 *   - 独立行：>!整行黑幕!<
 *   - 跨行：  >!第一行
 *              第二行!<
 *
 * 实现分两层：
 *   1. block 规则（插在 blockquote 之前）：拦截以 `>!` 开头的独立行，
 *      避免被 markdown-it 当作引用块（`>`）解析；
 *   2. inline 规则：解析段落中任意位置的 `>!...!<`。
 */
export function spoiler(md) {
  md.block.ruler.before('blockquote', 'spoiler', spoilerBlock)
  md.inline.ruler.before('emphasis', 'spoiler', spoilerInline)

  md.renderer.rules.spoiler_open = () => '<span class="spoiler" tabindex="0">'
  md.renderer.rules.spoiler_close = () => '</span>'
}

// 行内：匹配 `>!文字!<`（文字内支持粗体 / 链接等行内语法）
function spoilerInline(state, silent) {
  const src = state.src
  const start = state.pos
  if (src.charCodeAt(start) !== 0x3e /* > */) return false
  if (src.charCodeAt(start + 1) !== 0x21 /* ! */) return false

  const end = src.indexOf('!<', start + 2)
  if (end < 0) return false
  if (!src.slice(start + 2, end).trim()) return false

  if (silent) return true

  const oldPosMax = state.posMax
  state.pos = start + 2
  state.posMax = end

  const open = state.push('spoiler_open', 'span', 1)
  open.markup = '>!'

  state.md.inline.tokenize(state)

  const close = state.push('spoiler_close', 'span', -1)
  close.markup = '!<'

  state.pos = end + 2
  state.posMax = oldPosMax
  return true
}

// 块级：拦截以 `>!` 开头的独立行，收集到以 `!<` 结尾的行
function spoilerBlock(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine]
  const firstLine = state.src.slice(start, state.eMarks[startLine])
  if (!/^>!/.test(firstLine)) return false

  let lineNo = startLine
  const lines = []
  let closed = false
  while (lineNo < endLine) {
    const s = state.bMarks[lineNo] + state.tShift[lineNo]
    const e = state.eMarks[lineNo]
    const raw = state.src.slice(s, e)
    // 首行剥掉开头的 `>!`（允许后跟一个空格），其余行保留原文
    const body = lineNo === startLine ? raw.replace(/^>!\s?/, '') : raw
    lines.push(body)
    if (/\s*!<$/.test(raw)) {
      closed = true
      break
    }
    lineNo++
  }
  if (!closed) return false

  // 去掉内容末尾的 `!<`
  const content = lines.join('\n').replace(/\s*!<$/, '')
  if (!content.trim()) return false

  if (silent) return true

  const open = state.push('spoiler_open', 'span', 1)
  open.map = [startLine, lineNo + 1]

  // 只初始化空 children，内容交由 markdown-it core 的 inline 规则解析
  // （块级黑幕内部也支持粗体、链接等行内语法）
  const token = state.push('inline', '', 0)
  token.content = content
  token.children = []

  state.push('spoiler_close', 'span', -1)

  state.line = lineNo + 1
  return true
}
