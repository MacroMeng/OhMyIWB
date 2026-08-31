import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import markdownItTaskLists from 'markdown-it-task-lists'
import markdownItFootnote from 'markdown-it-footnote'

// 站点基本信息（RSS 生成与站点配置共用，避免两处维护）
const SITE_TITLE = 'OhMyIWB'
const SITE_DESC = 'OhMyIWB · 智在知互 思于识通'

// ===== 轻量 frontmatter 解析（用于 RSS 生成，避免引入额外依赖） =====
function unquote(s) {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1)
  }
  return s
}

function parseFrontmatter(src) {
  const res = {}
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return res
  const lines = match[1].split(/\r?\n/)
  let currentListKey = null
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    // 列表项续行：tags 下的 - item
    if (line.startsWith('- ') && currentListKey) {
      res[currentListKey].push(unquote(line.slice(2).trim()))
      continue
    }
    const kv = line.match(/^([\w-]+):\s*(.*)$/)
    if (!kv) continue
    const key = kv[1]
    const val = kv[2].trim()
    currentListKey = null
    if (val === '') {
      currentListKey = key
      res[key] = []
      continue
    }
    // 内联数组：[a, b, c]
    if (/^\[.*\]$/.test(val)) {
      res[key] = val
        .slice(1, -1)
        .split(',')
        .map((s) => unquote(s.trim()))
        .filter(Boolean)
      continue
    }
    // 布尔 / 数字
    if (val === 'true' || val === 'false') {
      res[key] = val === 'true'
    } else if (/^-?\d+$/.test(val)) {
      res[key] = Number(val)
    } else {
      res[key] = unquote(val)
    }
  }
  return res
}

function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ===== 站点 URL 解析：无需手动配置 siteUrl =====
// 优先级：kratos.siteUrl → package.json#homepage → 环境变量 SITE_URL
function resolveSiteUrl(kratos) {
  const fromConfig = String(kratos.siteUrl || '').replace(/\/+$/, '')
  if (fromConfig) return fromConfig
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'),
    )
    if (pkg.homepage) return String(pkg.homepage).replace(/\/+$/, '')
  } catch {
    /* package.json 缺失或不可读时忽略 */
  }
  for (const envName of ['SITE_URL', 'VITEPRESS_SITE_URL']) {
    if (process.env[envName]) return String(process.env[envName]).replace(/\/+$/, '')
  }
  return ''
}

// ===== 生成 RSS 订阅源（feed.xml / feed.rss） =====
function generateRss(siteConfig, targetDir, { warnMissingUrl = true } = {}) {
  // buildEnd 传入的是 VitePress 内部 config 对象，themeConfig 可能在顶层或 site 下
  const kratos =
    siteConfig.themeConfig?.kratos ||
    siteConfig.site?.themeConfig?.kratos ||
    siteConfig.userConfig?.themeConfig?.kratos ||
    {}
  // siteUrl 可选：自动从配置 / package.json#homepage / 环境变量解析
  const siteUrl = resolveSiteUrl(kratos)
  if (!siteUrl && warnMissingUrl) {
    console.warn(
      '[kratos] 未检测到站点 URL（可配置 kratos.siteUrl / package.json 的 homepage / 环境变量 SITE_URL），' +
        'feed.xml / feed.rss 将使用相对链接，建议配置以获得最佳订阅体验。',
    )
  }
  // 有绝对 URL 时生成绝对链接，否则回退为站点相对链接
  const abs = (p) => (siteUrl ? `${siteUrl}${p}` : p)
  // 顶层（dev）调用时没有解析后的 srcDir，回退为 cwd 下的 docs
  const postsDir = path.resolve(siteConfig.srcDir || 'docs', 'posts')
  if (!fs.existsSync(postsDir)) return

  // 递归收集 posts 目录下的全部 markdown（支持嵌套目录，排除目录索引页 index.md）
  const collectPostFiles = (dir, base = '') => {
    const out = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = `${base}${entry.name}`
      if (entry.isDirectory()) {
        out.push(...collectPostFiles(path.join(dir, entry.name), `${rel}/`))
      } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
        out.push(rel)
      }
    }
    return out
  }

  const items = collectPostFiles(postsDir)
    .map((rel) => {
      const src = fs.readFileSync(path.join(postsDir, rel), 'utf-8')
      const fm = parseFrontmatter(src)
      const slug = rel.replace(/\.md$/, '')
      return {
        title: fm.title || slug,
        link: abs(`/posts/${slug}`),
        date: fm.date ? new Date(fm.date).toUTCString() : '',
        description: fm.description || '',
        author: fm.author || '',
        tags: Array.isArray(fm.tags) ? fm.tags : [],
      }
    })
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const title = escapeXml(
    siteConfig.title || siteConfig.site?.title || '',
  )
  const description = escapeXml(
    siteConfig.description || siteConfig.site?.description || '',
  )
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${title}</title>
    <link>${abs('/')}</link>
    <description>${description}</description>
    <atom:link href="${abs('/feed.xml')}" rel="self" type="application/rss+xml"/>
    <language>zh-CN</language>
${items
      .map(
        (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <pubDate>${item.date}</pubDate>
      ${item.description ? `<description>${escapeXml(item.description)}</description>` : ''}
      ${
        item.author
          ? item.author.includes('@')
            ? `<author>${escapeXml(item.author)}</author>`
            : `<dc:creator>${escapeXml(item.author)}</dc:creator>`
          : ''
      }
      ${item.tags.map((t) => `      <category>${escapeXml(t)}</category>`).join('\n')}
    </item>`,
      )
      .join('\n')}
  </channel>
</rss>
`
  fs.mkdirSync(targetDir, { recursive: true })
  // 同时提供 feed.xml / feed.rss 两个订阅入口，内容一致
  for (const fileName of ['feed.xml', 'feed.rss']) {
    fs.writeFileSync(path.join(targetDir, fileName), feed, 'utf-8')
  }
  console.log(`[kratos] RSS 订阅源已生成：feed.xml / feed.rss（${items.length} 篇文章）`)
}

// ===== 站点 public 目录 =====
// 文章中的 /assets/... 引用（如 <img src="/assets/images/omi.webp">）直接由
// VitePress 原生 public 机制解析：docs/public 下的文件在构建时复制到 dist 根目录，
// dev 时按根路径提供。站点资源（图片、feed.xml / feed.rss 等）统一放在 docs/public 并提交到 Git。
const sitePublicDir = path.resolve(process.cwd(), 'docs', 'public')
// dev 模式下 buildEnd 不会执行，这里同步生成一份到 docs/public：
// dev 服务器可直接访问 /feed.xml，build 时 VitePress 也会随 public 目录自动复制进 dist
generateRss(
  { title: SITE_TITLE, description: SITE_DESC },
  sitePublicDir,
  { warnMissingUrl: false },
)

// ===== 根据 posts 目录结构动态生成顶部导航 =====
// 每个含 index.md 的一级子目录生成一项，点击进入该目录的列表页（/posts/<dir>/）
function readDirTitle(postsDir, dir) {
  try {
    const src = fs.readFileSync(path.join(postsDir, dir, 'index.md'), 'utf-8')
    const m = src.match(/^title:\s*(.+?)\s*$/m)
    if (m) return unquote(m[1].trim())
  } catch {
    /* 无 index.md 时回退为目录名 */
  }
  return dir
}

function getPostsNav() {
  const postsDir = path.resolve(process.cwd(), 'docs', 'posts')
  if (!fs.existsSync(postsDir)) return []
  return fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        !d.name.startsWith('.') &&
        fs.existsSync(path.join(postsDir, d.name, 'index.md')),
    )
    .map((d) => ({ text: readDirTitle(postsDir, d.name), link: `/posts/${d.name}/` }))
}

// Kratos for VitePress 站点配置
// 主题专属配置统一放在 themeConfig.kratos 中
export default defineConfig({
  title: SITE_TITLE,
  description: SITE_DESC,
  lang: 'zh-CN',
  cleanUrls: true,
  // 允许浅色 / 暗色模式切换（默认跟随系统）
  appearance: true,
  markdown: {
    // 代码块统一使用深色高亮配色（配合深色代码块背景）
    theme: {
      light: 'github-dark',
      dark: 'github-dark',
    },
    config(md) {
      // 启用 GFM 任务列表渲染（[x] / [ ]），enabled: true 使 checkbox 可交互
      md.use(markdownItTaskLists, { enabled: true })
      // 启用脚注渲染（[^1]），文章中的参考资料脚注依赖此插件
      md.use(markdownItFootnote)
      // 正文图片懒加载 + 异步解码（浏览器对视口内图片仍会立即加载，不影响首屏）
      const defaultImageRender = md.renderer.rules.image
      md.renderer.rules.image = (tokens, idx, opts, env, self) => {
        const token = tokens[idx]
        if (!token.attrGet('loading')) token.attrSet('loading', 'lazy')
        if (!token.attrGet('decoding')) token.attrSet('decoding', 'async')
        return defaultImageRender
          ? defaultImageRender(tokens, idx, opts, env, self)
          : self.renderToken(tokens, idx, opts)
      }
    },
  },
  // 规避 Windows 中文路径下 realpathSync 规范化路径与 Rollup facadeModuleId 不一致导致的构建报错
  vite: {
    resolve: {
      preserveSymlinks: true,
    },
  },
  head: [
    ['meta', { name: 'theme-color', content: '#7c3aed' }],
    ['meta', { name: 'format-detection', content: 'telphone=no, date=no, address=no, email=no' }],
    ['link', { rel: 'icon', href: '/assets/omi.svg' }],
    // 尚古字体：preconnect 提前建连 + 并行加载（替代 index.css 内的 @import，避免串行等待）
    ['link', { rel: 'preconnect', href: 'https://fontsapi.zeoseven.com', crossorigin: 'anonymous' }],
    ['link', { rel: 'stylesheet', href: 'https://fontsapi.zeoseven.com/165/main/result.css' }],
    ['link', { rel: 'stylesheet', href: 'https://fontsapi.zeoseven.com/166/main/result.css' }],
  ],

  // 构建完成后生成 RSS 订阅源（feed.xml / feed.rss）：buildEnd 用完整 siteConfig 覆盖写入 outDir
  buildEnd(siteConfig) {
    generateRss(siteConfig, siteConfig.outDir)
  },

  themeConfig: {
    // ===== Kratos 主题专属配置 =====
    kratos: {
      // 站点部署 URL（用于 RSS 订阅源）
      // 可选：未配置时自动读取 package.json#homepage 或环境变量 SITE_URL，
      // 均不存在时 feed.xml 使用站点相对链接
      siteUrl: 'https://ohmyiwb.mm666.qzz.io',
      // Giscus 评论（基于 GitHub Discussions）
      // 在 GitHub 仓库开启 Discussions 后，到 https://giscus.app 生成配置填入
      // repo 为空时评论区域自动隐藏
      giscus: {
        repo: 'MacroMeng/OhMyIWB',
        repoId: 'R_kgDOSacAqQ',
        category: 'General',
        categoryId: 'DIC_kwDOSacAqc4DEk5o',
        mapping: 'pathname',
        // 布尔开关用 0/1（组件会转为 giscus 的 data-* 字符串 '0'/'1'）
        strict: 1,
        reactionsEnabled: 1,
        emitMetadata: 0,
        inputPosition: 'top',
        lang: 'zh-CN',
        // 主题不在此配置：组件根据站点明暗模式动态设置并同步 giscus
      },
      // 顶部导航栏品牌
      brand: {
        name: 'OhMyIWB',
        logo: '/assets/omi.svg',
      },
      // 首页 Banner
      banner: {
        title: 'OhMyIWB',
        describe: '智在知互 · 思于识通',
        image: '/assets/Poster.webp',
      },
      // 侧边栏 - 个人简介
      about: {
        avatar: '/assets/CharacterOnly.png',
        name: 'OhMyIWB',
        describe: '「智在知互 · 思于识通」一个扎根于社区的博客类项目，不定期分享 IWB 小知识、软件、更新等内容。',
        social: [
          { icon: 'github', label: 'GitHub', url: 'https://github.com/MacroMeng/OhMyIWB' },
          { icon: 'rss', label: 'RSS', url: '/feed.xml' },
        ],
      },
      // 侧边栏小工具开关
      widgets: {
        toc: true,
        about: true,
        tags: true,
        posts: true,
        search: true,
      },
      // 页脚
      footer: {
        copyright: 'COPYRIGHT © 2026 OHMYIWB PROJECT · 以 CC-BY-NC-SA 4.0 公开',
        icp: '',
        gov: '',
      },
    },

    // ===== 顶部导航菜单 =====
    // 首页 + 关于 + 由 posts 目录结构动态生成的文章分区导航（含 index.md 的子目录各一项，指向目录根）
    nav: [
      { text: '首页', link: '/' },
      { text: '关于', link: '/about' },
      ...getPostsNav(),
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/MacroMeng/OhMyIWB' }],
  },
})