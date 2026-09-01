/**
 * markdown-it 插件：实现 Flarum 论坛「帖子编辑指南」中的 BBCode 语法
 *
 * 参考：https://forum.smart-teach.cn/d/27-tie-zi-bian-ji-zhi-nan
 *
 * 支持的语法：
 *   - 文本：  [center]、[b]、[i]、[s]、[del]、[color=色值]、[size=字号]、[url=链接]、[email]
 *   - 引用：  [quote=作者]内容[/quote]
 *   - 警告框 A 系：  [AWARNING] [ASUCCESS] [AINFO] [ABASIC] [ACUSTOM]
 *   - 警告框 B 系：  [BWARNING] [BSUCCESS] [BERROR] [BCUSTOM]
 *   - 警告框 C 系：  [CSUCCESS] [CNOTICE] [CWARNING] [CERROR]
 *   - 警告框 D 系：  [DSUCCESS] [DNOTICE] [DWARNING] [DERROR]
 *   - 网盘链接：     [cloud type=网盘类型 title=标题 url=链接]提取码[/cloud]
 *   - 列表：         [list][*]项目一[*]项目二[/list]
 *
 * 实现分两层：
 *   1. block 规则：拦截以 `[块级标签...]` 开头的独立行，收集到 `[/标签]` 结束，
 *      内容交给 renderer 递归渲染（支持内部嵌套 Markdown 与 BBCode）；
 *   2. inline 规则：解析段落中的 `[b]...[b]` 等行内标签。
 */
export function bbcode(md) {
  md.block.ruler.before('paragraph', 'bbcode_block', bbcodeBlock)
  md.inline.ruler.before('emphasis', 'bbcode_inline', bbcodeInline)

  md.renderer.rules.bbcode_block = (tokens, idx, options, env, self) =>
    renderBlock(md, tokens[idx].meta, options, env)
  md.renderer.rules.bbcode_inline = (tokens, idx, options, env, self) =>
    renderInline(md, tokens[idx].meta, options, env)
}

// ===== 标签清单 =====

// 块级标签（独立成块，独占行）
const BLOCK_TAGS = [
  'center', 'quote', 'list',
  'awarning', 'asuccess', 'ainfo', 'abasic', 'acustom',
  'bwarning', 'bsuccess', 'berror', 'bcustom',
  'csuccess', 'cnotice', 'cwarning', 'cerror',
  'dsuccess', 'dnotice', 'dwarning', 'derror',
  'cloud',
]

// 行内标签
const INLINE_TAGS = ['b', 'i', 's', 'del', 'color', 'size', 'url', 'email']

// ===== 工具函数 =====

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escAttr(s) {
  return escHtml(s)
}

function sanitizeHref(url) {
  const s = String(url || '').trim()
  if (!s) return ''
  // 阻止 javascript: / vbscript: / data: 注入
  if (/^(javascript|vbscript|data):/i.test(s)) return ''
  return s
}

// CSS 颜色白名单：仅允许颜色关键字 / hex / rgb(a) / hsl(a) / 变量
function safeColor(s) {
  const v = String(s || '').trim()
  return /^[a-zA-Z#()0-9,.\s%-]+$/.test(v) ? v : ''
}

// 字号归一化：[size=20] → 20px；[size=1.2em] 原样保留
function normalizeSize(s) {
  const v = String(s || '').trim()
  if (/^\d+(\.\d+)?$/.test(v)) return `${v}px`
  return /^[\d.]+(px|em|rem|pt|%)$/.test(v) ? v : ''
}

// 解析开标签属性：支持 [quote=作者] 与 [cloud type=x title=y url=z] 两种形态
function parseAttrs(attrStr) {
  const s = String(attrStr || '').trim()
  if (!s) return {}
  if (s.startsWith('=')) {
    return { value: s.slice(1).trim().replace(/^["']|["']$/g, '') }
  }
  const attrs = {}
  const re = /([A-Za-z0-9]+)\s*=\s*("[^"]*"|'[^']*'|[^\s]+)/g
  let m
  while ((m = re.exec(s))) {
    attrs[m[1].toLowerCase()] = m[2].replace(/^["']|["']$/g, '')
  }
  return attrs
}

// ACUSTOM：[red,black,green,内容] → { font, bg, border, message }
function parseAcustom(content) {
  const parts = String(content).split(',')
  if (parts.length < 4) return null
  return {
    font: parts[0].trim(),
    bg: parts[1].trim(),
    border: parts[2].trim(),
    message: parts.slice(3).join(',').trim(),
  }
}

// C 系列：[green,white,green,标题,消息] → { font, bg, border, title, message }
function parseCSeries(content) {
  const parts = String(content).split(',').map((s) => s.trim())
  if (parts.length < 5) return null
  return {
    font: parts[0],
    bg: parts[1],
    border: parts[2],
    title: parts[3],
    message: parts.slice(4).join(',').trim(),
  }
}

// BCUSTOM：title=... font=... bg=... border=...（title 可含空格，非贪婪匹配到 ` font=`）
function parseBcustom(content) {
  const m = String(content).match(
    /title=([\s\S]*?)\s+font=([^\s]+)\s+bg=([^\s]+)\s+border=([^\s]+)\s*$/,
  )
  if (!m) return null
  return { title: m[1].trim(), font: m[2], bg: m[3], border: m[4] }
}


// 网盘类型映射（type → 网盘名称）
const CLOUD_TYPES = {
  '123': '123云盘',
  lz: '蓝奏云',
  ali: '阿里云盘',
  github: 'GitHub',
  google: 'Google Drive',
  one: 'OneDrive',
  mega: 'MEGA',
  dropbox: 'Dropbox',
  mediafire: 'MediaFire',
  bd: '百度网盘',
  tx: '腾讯微云',
  gitee: 'Gitee',
  '360': '360云盘',
  ty: '天翼云盘',
  ct: '中国移动云盘',
}

// GitHub / Gitee 的「提取码」实际语义是版本号（与论坛一致）
const CLOUD_CODE_LABEL = { github: '版本', gitee: '版本' }

// ===== 图标（Feather 线性风格，与站内 Icon.vue 保持一致） =====
const ICON_PATHS = {
  warning:
    '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  success:
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  error:
    '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  info:
    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  basic:
    '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  notice:
    '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  custom:
    '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20 2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2h1a4 4 0 0 0 4-4 10 10 0 0 0-9-11z"/>',
  quote:
    '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2-2-2H4c-1.25 0-2 .75-2 2v3c0 1.25.75 2 2 2h1c0 4-1 5-3 5"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2h-4c-1.25 0-2 .75-2 2v3c0 1.25.75 2 2 2h1c0 4-1 5-3 5"/>',
  cloud:
    '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  drive:
    '<line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>',
  github:
    '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
  folder:
    '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  key:
    '<path d="M12.65 10a6 6 0 1 0 0 4H16v3h3v-3h2.5l1.5-2-1.5-2H12.65z"/><circle cx="6.5" cy="12" r="2.5"/>',
}

// 各网盘对应的图标（无品牌图标时回退到通用云/硬盘图标）
const CLOUD_ICON_NAMES = {
  github: 'github',
  gitee: 'github',
  '123': 'drive',
  lz: 'cloud',
  ali: 'cloud',
  bd: 'cloud',
  tx: 'cloud',
  one: 'cloud',
  mega: 'drive',
  dropbox: 'folder',
  mediafire: 'folder',
  google: 'drive',
  '360': 'cloud',
  ty: 'cloud',
  ct: 'cloud',
}

/** 生成内联 SVG 图标（stroke 跟随 currentColor，尺寸由 CSS 控制） */
function svgIcon(name, cls) {
  const d = ICON_PATHS[name]
  if (!d) return ''
  return (
    '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    d +
    '</svg>'
  )
}

// A 系警告框：预设主题（标题与颜色在 CSS 中通过 class 定义）
// 注意：论坛原版 [AWARNING] 渲染为红色（aaerror），语义是「严重警告」，
// 与 B 系橙色的 [BWARNING] 不同，这里保持一致。
const A_ALERTS = {
  awarning: { cls: 'bbcode-alert-error', icon: 'warning', title: '严重警告' },
  asuccess: { cls: 'bbcode-alert-success', icon: 'success', title: '成功' },
  ainfo: { cls: 'bbcode-alert-info', icon: 'info', title: '信息' },
  abasic: { cls: 'bbcode-alert-basic', icon: 'basic', title: '基本提示' },
}

// B 系警告框：带大写英文标题
const B_ALERTS = {
  bwarning: { cls: 'bbcode-alert-warning', icon: 'warning', title: 'WARNING' },
  bsuccess: { cls: 'bbcode-alert-success', icon: 'success', title: 'SUCCESS' },
  berror: { cls: 'bbcode-alert-error', icon: 'error', title: 'ERROR' },
}

// C / D 系警告框：语义决定图标，配色来自参数
const CD_ICONS = {
  csuccess: 'success', cnotice: 'notice', cwarning: 'warning', cerror: 'error',
  dsuccess: 'success', dnotice: 'notice', dwarning: 'warning', derror: 'error',
}

/**
 * 拼接自定义配色的 inline style。
 *
 * 论坛原实现直接把 font/bg/border 三个颜色写死到 inline style 上
 * （典型值为「红字 + 白底」），在本站暗色模式下会出现纯白色块与
 * 不可读的对比度。因此这里只取一个「强调色」（border 优先，回退 font），
 * 背景与文字颜色交由 CSS 用 color-mix 从强调色派生，
 * 既保留作者指定的色相，又能同时适配亮色 / 暗色主题。
 */
function customStyle(font, _bg, border) {
  const accent = safeColor(border) || safeColor(font)
  return accent ? '--bb-accent:' + escAttr(accent) + ';' : ''
}

/** 警告框统一骨架 */
function alertHtml({ cls, icon, title, body, style }) {
  const hasTitle = Boolean(title)
  const hasBody = Boolean(body)
  return (
    '<div class="bbcode-alert ' + cls +
    (hasBody ? '' : ' bbcode-alert-titleonly') + '" role="alert"' +
    (style ? ' style="' + style + '"' : '') +
    '>' +
    (hasTitle
      ? '<div class="bbcode-alert-title">' +
        svgIcon(icon, 'bbcode-alert-icon') +
        '<span class="bbcode-alert-label">' + title + '</span>' +
        '</div>'
      : '') +
    (hasBody
      ? '<div class="bbcode-alert-body">' +
        (hasTitle ? '' : svgIcon(icon, 'bbcode-alert-icon')) +
        body +
        '</div>'
      : '') +
    '</div>'
  )
}

// ===== 块级规则 =====
function bbcodeBlock(state, startLine, endLine, silent) {
  const start = state.bMarks[startLine] + state.tShift[startLine]
  const firstLine = state.src.slice(start, state.eMarks[startLine])
  const m = firstLine.match(/^\[([A-Za-z][A-Za-z0-9]*)([^\]]*)\](.*)$/)
  if (!m) return false
  const tag = m[1].toLowerCase()
  if (!BLOCK_TAGS.includes(tag)) return false

  const closeRe = new RegExp('\\[/' + m[1] + '\\]', 'i')
  const lines = []
  let lineNo = startLine
  let endFound = false

  // 开标签行中可能已包含闭合（[center]文本[/center]）
  let rest = m[3]
  if (closeRe.test(rest)) {
    rest = rest.replace(closeRe, '')
    lines.push(rest)
    endFound = true
  } else {
    lines.push(rest)
    lineNo++
    while (lineNo < endLine) {
      const s = state.bMarks[lineNo] + state.tShift[lineNo]
      const raw = state.src.slice(s, state.eMarks[lineNo])
      if (closeRe.test(raw)) {
        lines.push(raw.replace(closeRe, ''))
        endFound = true
        break
      }
      lines.push(raw)
      lineNo++
    }
  }
  if (!endFound) return false
  if (silent) return true

  const token = state.push('bbcode_block', '', 0)
  token.meta = { tag, attr: m[2], content: lines.join('\n') }
  token.map = [startLine, lineNo + 1]
  state.line = lineNo + 1
  return true
}

// ===== 行内规则 =====
function bbcodeInline(state, silent) {
  const src = state.src.slice(state.pos)
  const m = src.match(
    /^\[(b|i|s|del|color|size|url|email)(?:=([^\]]*?))?\]([^\n]*?)\[\/\1\]/i,
  )
  if (!m) return false
  const tag = m[1].toLowerCase()
  if (!INLINE_TAGS.includes(tag)) return false
  if (silent) return true

  const token = state.push('bbcode_inline', '', 0)
  token.meta = { tag, attr: m[2], content: m[3] }
  state.pos += m[0].length
  return true
}

// ===== 行内渲染 =====
function renderInline(md, meta, options, env) {
  const { tag, attr, content } = meta
  const inner = md.renderInline(content, env)

  switch (tag) {
    case 'b':
      return '<strong>' + inner + '</strong>'
    case 'i':
      return '<em>' + inner + '</em>'
    case 's':
    case 'del':
      return '<del class="bbcode-strike">' + inner + '</del>'
    case 'color': {
      const c = safeColor(attr)
      return c
        ? '<span class="bbcode-color" style="color:' + escAttr(c) + '">' + inner + '</span>'
        : inner
    }
    case 'size': {
      const sz = normalizeSize(attr)
      return sz
        ? '<span class="bbcode-size" style="font-size:' + escAttr(sz) + '">' + inner + '</span>'
        : inner
    }
    case 'url': {
      const href = sanitizeHref(attr || content)
      return href
        ? '<a class="bbcode-url" href="' + escAttr(href) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>'
        : inner
    }
    case 'email': {
      const addr = (attr || content || '').trim()
      if (!addr) return inner
      // 内容通常就是邮箱地址，直接转义为纯文本，避免 linkify 二次转换产生嵌套 <a>
      const label = content ? escHtml(content) : escHtml(addr)
      return (
        '<a class="bbcode-email" href="mailto:' + escAttr(addr) + '">' + label + '</a>'
      )
    }
    default:
      return inner
  }
}

// ===== 块级渲染 =====
function renderBlock(md, meta, options, env) {
  const { tag, attr, content } = meta
  const attrs = parseAttrs(attr)
  const inner = () => md.render(content, env)
  const titleFromAttrs = attrs.title

  switch (tag) {
    case 'center':
      return '<div class="bbcode-center">' + inner() + '</div>'

    case 'quote':
      return (
        '<blockquote class="bbcode-quote">' +
        (attrs.value
          ? '<div class="bbcode-quote-author">' +
            svgIcon('quote', 'bbcode-quote-icon') +
            '<span>' + escHtml(attrs.value) + '</span>' +
            '</div>'
          : '') +
        '<div class="bbcode-quote-content">' + inner() + '</div>' +
        '</blockquote>'
      )

    case 'list': {
      const items = content
        .split(/\[\*\]/)
        .map((s) => s.trim())
        .filter(Boolean)
      const lis = items
        .map((item) =>
          '<li>' +
          md.render(item, env).replace(/^<p>|<\/p>\s*$/g, '').trim() +
          '</li>',
        )
        .join('')
      return '<ul class="bbcode-list">' + lis + '</ul>'
    }

    // ===== A 系警告框 =====
    case 'awarning':
    case 'asuccess':
    case 'ainfo':
    case 'abasic': {
      const conf = A_ALERTS[tag]
      return alertHtml({
        cls: conf.cls,
        icon: conf.icon,
        title: conf.title,
        body: inner(),
      })
    }

    case 'acustom': {
      const c = parseAcustom(content)
      if (!c) return inner()
      return alertHtml({
        cls: 'bbcode-alert-custom',
        icon: 'custom',
        title: '自定义提示',
        body: md.render(c.message, env),
        style: customStyle(c.font, c.bg, c.border),
      })
    }

    // ===== B 系警告框 =====
    case 'bwarning':
    case 'bsuccess':
    case 'berror': {
      const conf = B_ALERTS[tag]
      return alertHtml({
        cls: conf.cls + ' bbcode-alert-big',
        icon: conf.icon,
        title: conf.title,
        body: inner(),
      })
    }

    case 'bcustom': {
      const c = parseBcustom(content)
      if (!c) return inner()
      return alertHtml({
        cls: 'bbcode-alert-custom',
        icon: 'custom',
        title: escHtml(c.title),
        body: '',
        style: customStyle(c.font, c.bg, c.border),
      })
    }

    // ===== C 系警告框（颜色在内容里：font,bg,border,标题,消息） =====
    case 'csuccess':
    case 'cnotice':
    case 'cwarning':
    case 'cerror': {
      const c = parseCSeries(content)
      if (!c) return inner()
      return alertHtml({
        cls: 'bbcode-alert-custom',
        icon: CD_ICONS[tag],
        title: escHtml(c.title),
        body: md.render(c.message, env),
        style: customStyle(c.font, c.bg, c.border),
      })
    }

    // ===== D 系警告框（颜色在开标签属性里，内容为消息） =====
    case 'dsuccess':
    case 'dnotice':
    case 'dwarning':
    case 'derror': {
      return alertHtml({
        cls: 'bbcode-alert-custom',
        icon: CD_ICONS[tag],
        title: escHtml(titleFromAttrs || ''),
        body: inner(),
        style: customStyle(attrs.font, attrs.bg, attrs.border),
      })
    }

    // ===== 网盘链接 =====
    case 'cloud': {
      const type = String(attrs.type || '').toLowerCase()
      const name = CLOUD_TYPES[type] || type || '网盘'
      const icon = CLOUD_ICON_NAMES[type] || 'cloud'
      const url = sanitizeHref(attrs.url)
      const title = attrs.title || name
      const pwd = content.trim()
      const codeLabel = CLOUD_CODE_LABEL[type] || '提取码'
      return (
        '<div class="bbcode-cloud' + (type ? ' bbcode-cloud-' + escAttr(type) : '') + '">' +
        '<span class="bbcode-cloud-icon">' + svgIcon(icon, 'bbcode-cloud-svg') + '</span>' +
        '<span class="bbcode-cloud-info">' +
        '<span class="bbcode-cloud-name">' + escHtml(name) + '</span>' +
        '<span class="bbcode-cloud-title">' + escHtml(title) + '</span>' +
        (pwd
          ? '<span class="bbcode-cloud-pwd">' +
            svgIcon('key', 'bbcode-cloud-pwd-icon') +
            escHtml(codeLabel) + '：<code>' + escHtml(pwd) + '</code>' +
            '</span>'
          : '') +
        '</span>' +
        (url
          ? '<a class="bbcode-cloud-btn" href="' + escAttr(url) +
            '" target="_blank" rel="noopener noreferrer">' +
            svgIcon('download', 'bbcode-cloud-btn-icon') +
            '<span>前往下载</span></a>'
          : '') +
        '</div>'
      )
    }

    default:
      return inner()
  }
}
