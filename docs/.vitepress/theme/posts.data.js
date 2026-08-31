import { createContentLoader } from 'vitepress'

/**
 * 计算文章预计阅读时间
 * 规则：剥离 frontmatter 与代码块后，
 * 中文字符按 300 字/分钟、英文单词按 200 词/分钟估算
 */
function calcReadingTime(src) {
  if (!src) return 1
  // 剥离 frontmatter
  const body = src.replace(/^---[\s\S]*?---\s*/, '')
  // 剥离代码块
  const noCode = body.replace(/```[\s\S]*?```/g, ' ')
  // 中文字符（含 CJK 扩展区）
  const cjk = (noCode.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length
  // 英文单词 / 数字 / 拼音音节
  const words = (
    noCode
      .replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ')
      .match(/[a-zA-Z0-9][\w'-]*/g) || []
  ).length
  return Math.max(1, Math.round(cjk / 300 + words / 200))
}

/**
 * 生成卡片摘要：
 * - 文章含 <!-- more --> 标记时，直接使用标记前的渲染 HTML（作者手动圈定，
 *   不做截断；超长时由卡片 CSS 3 行截断显示）
 * - 无标记时从正文提取纯文本，截取前 75 字——桌面/平板 3 列卡片摘要区为
 *   3 行（每行约 25-27 个汉字），75 字可完整展示、不会被 CSS 硬折断
 */
function buildExcerpt(item) {
  // 有 <!-- more -->：作者手写摘要，原样返回
  if (item.excerpt) return item.excerpt
  if (!item.src) return ''
  const body = item.src.replace(/^---[\s\S]*?---\s*/, '')
  const text = body
    // 代码块整体移除
    .replace(/```[\s\S]*?```/g, ' ')
    // 图片移除，链接保留文字
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // HTML 标签移除
    .replace(/<[^>]+>/g, ' ')
    // 行首 markdown 标记（标题/引用/列表）移除
    .replace(/^[#>*+\-\s]+/gm, ' ')
    // 压缩空白
    .replace(/\s+/g, ' ')
    .trim()
  return text ? text.slice(0, 75) : ''
}

/**
 * 文章数据加载器（Data Loader）
 * 在构建时于 Node 端执行，抓取 docs/posts 下的文章并按日期倒序排列
 * 摘要：优先 <!-- more --> 标记截断；无标记时自动取正文开头纯文本
 * 组件中通过 `import { data as posts } from '../posts.data.js'` 获取
 */
export default createContentLoader('posts/**/*.md', {
  excerpt: '<!-- more -->',
  includeSrc: true,
  transform(raw) {
    return raw
      // 排除目录索引页（posts/daily/index.md → URL /posts/daily/）
      .filter((item) => !item.url.endsWith('/'))
      .map((item) => {
        // dir：posts 下的一级子目录名（根目录文章为空字符串）
        const rel = item.url.replace(/^\/posts\/?/, '')
        const dir = rel.includes('/') ? rel.split('/')[0] : ''
        return {
          url: item.url,
          frontmatter: item.frontmatter || {},
          excerpt: buildExcerpt(item),
          // 是否使用 <!-- more --> 手动截断摘要（createContentLoader 无标记时 excerpt 为空）
          hasMore: !!item.excerpt,
          // 预计阅读时间（分钟），由完整源码计算
          readingTime: calcReadingTime(item.src),
          dir,
        }
      })
      .sort(
        (a, b) =>
          +new Date(b.frontmatter.date || 0) - +new Date(a.frontmatter.date || 0),
      )
  },
})
