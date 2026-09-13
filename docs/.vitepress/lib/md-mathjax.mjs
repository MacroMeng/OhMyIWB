/**
 * markdown-it 插件：LaTeX 数学公式（行内 `$...$` / 块级 `$$...$$`）
 *
 * 为什么不用 VitePress 的 `markdown.math` 选项：
 *   该选项把渲染器硬编码为 `import('markdown-it-mathjax3')`，并把该包声明为
 *   「可选 peer 依赖」且锁定 `^4`（1.6.4 与 2.0.0-alpha.20 均如此），于是：
 *     1. 上游发布 5.x 后，npm 7+ 的 peer 校验会在安装阶段直接 ERESOLVE
 *        （PR #4 的 Cloudflare Pages 构建失败即卡在 `npm ci`）；
 *     2. 5.x 还把插件签名退化为单参 `(md)`，配置项被静默丢弃；
 *     3. 5.x 输出不再以 `<mjx-container ` 开头，块级公式会丢失键盘可聚焦。
 *   为彻底摆脱「peer 版本锁 + 第三方封装包的破坏性升级」，这里把
 *   markdown-it-mathjax3@4.3.2 的全部实现（MIT License，© TANIGUCHI Masaya）
 *   内联进仓库，直接使用它底层的两个依赖 mathjax-full + juice。
 *
 * 输出与 4.3.2 逐字节一致（已用 11 组文档做 diff 验证），因此
 * theme/styles/md-plugins.css 中针对 `mjx-container` 的样式无需任何改动。
 *
 * 与 VitePress 内置行为的唯一差异：块级公式的 `tabindex="0"` 由本插件注入
 * （VitePress 原本额外包一层 `/^<mjx-container /` 正则替换，此处合二为一）。
 *
 * ⚠️ 维护者须知：因为不再使用 VitePress 的 markdown.math 开关，config.mjs 中必须
 *    保留 `vue.template.compilerOptions.isCustomElement`（把 `mjx-*` 视为原生元素），
 *    否则 <mjx-container> 会被 Vue 当作未注册组件，SSR 阶段渲染成空注释 <!---->，
 *    公式会静默整体消失（VitePress 仅在 markdown.math 为真时自动注入该检查器）。
 */
// 注意：这里必须给 mathjax 取别名，因为本文件同时导出了名为 mathjax 的插件函数
import { mathjax as mathjaxLib } from 'mathjax-full/js/mathjax.js'
import { TeX } from 'mathjax-full/js/input/tex.js'
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js'
import { SVG } from 'mathjax-full/js/output/svg.js'
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js'
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js'
import { AssistiveMmlHandler } from 'mathjax-full/js/a11y/assistive-mml.js'
import juice from 'juice/client.js'

// MathJax 3 的 document 是无 DOM 的轻量实现，构建期同步渲染出 SVG 字符串；
// MathJax 自带的 <style> 由 juice 内联到元素上，因此前端零运行时开销。
function renderMath(content, documentOptions, convertOptions) {
  const adaptor = liteAdaptor()
  const handler = RegisterHTMLHandler(adaptor)
  // 生成 <mjx-assistive-mml>：屏幕阅读器可朗读公式
  AssistiveMmlHandler(handler)
  const mathDocument = mathjaxLib.document(content, documentOptions)
  const html = adaptor.outerHTML(mathDocument.convert(content, convertOptions))
  const stylesheet = adaptor.outerHTML(documentOptions.OutputJax.styleSheet(mathDocument))
  return juice(html + stylesheet)
}

// 判断某个 `$` 是开定界符还是闭定界符
// 前提：state.src[pos] 一定是 "$"
function isValidDelim(state, pos) {
  const max = state.posMax
  let can_open = true
  let can_close = true
  const prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1
  const nextChar = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1

  // 开定界符右侧、闭定界符左侧不能是空白；闭定界符右侧不能紧跟数字
  if (prevChar === 0x20 /* " " */ || prevChar === 0x09 /* \t */ || (nextChar >= 0x30 /* "0" */ && nextChar <= 0x39 /* "9" */)) {
    can_close = false
  }
  if (nextChar === 0x20 /* " " */ || nextChar === 0x09 /* \t */) {
    can_open = false
  }

  return { can_open, can_close }
}

// 行内公式：`$...$`
function mathInline(state, silent) {
  if (state.src[state.pos] !== '$') return false

  let res = isValidDelim(state, state.pos)
  if (!res.can_open) {
    if (!silent) state.pending += '$'
    state.pos += 1
    return true
  }

  // 跳过被转义的 `$`（如 \$5），找真正的闭定界符
  const start = state.pos + 1
  let match = start
  while ((match = state.src.indexOf('$', match)) !== -1) {
    // 向左统计连续反斜杠个数：偶数个说明该 `$` 未被转义
    let pos = match - 1
    while (state.src[pos] === '\\') pos -= 1
    if ((match - pos) % 2 === 1) break
    match += 1
  }

  if (match === -1) {
    if (!silent) state.pending += '$'
    state.pos = start
    return true
  }

  // `$$` 内容为空，不当作公式
  if (match - start === 0) {
    if (!silent) state.pending += '$$'
    state.pos = start + 1
    return true
  }

  res = isValidDelim(state, match)
  if (!res.can_close) {
    if (!silent) state.pending += '$'
    state.pos = start
    return true
  }

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '$'
    token.content = state.src.slice(start, match)
  }
  state.pos = match + 1
  return true
}

// 块级公式：`$$...$$`（可单行，也可跨多行；需独占若干行）
function mathBlock(state, start, end, silent) {
  let next
  let lastPos
  let found = false
  let pos = state.bMarks[start] + state.tShift[start]
  let max = state.eMarks[start]
  let lastLine = ''

  if (pos + 2 > max) return false
  if (state.src.slice(pos, pos + 2) !== '$$') return false
  pos += 2

  let firstLine = state.src.slice(pos, max)
  if (silent) return true

  if (firstLine.trim().slice(-2) === '$$') {
    // 单行写法：$$ E = mc^2 $$
    firstLine = firstLine.trim().slice(0, -2)
    found = true
  }

  for (next = start; !found; ) {
    next++
    if (next >= end) break

    pos = state.bMarks[next] + state.tShift[next]
    max = state.eMarks[next]

    // 缩进小于块级缩进的非空行会终止公式
    if (pos < max && state.tShift[next] < state.blkIndent) break

    if (state.src.slice(pos, max).trim().slice(-2) === '$$') {
      lastPos = state.src.slice(0, max).lastIndexOf('$$')
      lastLine = state.src.slice(pos, lastPos)
      found = true
    }
  }

  state.line = next + 1

  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.content =
    (firstLine && firstLine.trim() ? firstLine + '\n' : '') +
    state.getLines(start + 1, next, state.tShift[start], true) +
    (lastLine && lastLine.trim() ? lastLine : '')
  token.map = [start, state.line]
  token.markup = '$$'
  return true
}

/**
 * 注册 LaTeX 数学公式插件
 *
 * @param {import('markdown-it')} md
 * @param {{ svg?: object, tex?: object }} [options]
 *   svg: 传给 MathJax SVG 输出器的选项（默认 fontCache: 'none'）
 *   tex: 传给 MathJax TeX 输入器的选项（packages / macros 等）
 */
export function mathjax(md, options = {}) {
  // fontCache: 'none' —— 不用字体缓存，避免同页多个公式共享 <defs> 后被 SSR 拆分导致字形丢失
  const documentOptions = {
    InputJax: new TeX({ packages: AllPackages, ...options.tex }),
    OutputJax: new SVG({ fontCache: 'none', ...options.svg }),
  }
  const convertOptions = { display: false }

  const render = (content, display) => {
    convertOptions.display = display
    return renderMath(content, documentOptions, convertOptions)
  }

  md.inline.ruler.after('escape', 'math_inline', mathInline)
  md.block.ruler.after('blockquote', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })

  md.renderer.rules.math_inline = (tokens, idx) => render(tokens[idx].content, false)
  md.renderer.rules.math_block = (tokens, idx) =>
    // 注入 tabindex="0"：块级公式可键盘聚焦，再用方向键横向滚动超宽公式
    render(tokens[idx].content, true).replace(/^<mjx-container /, '<mjx-container tabindex="0" ')
}
