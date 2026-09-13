<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const { theme, isDark, site } = useData()
const route = useRoute()

const giscusRef = ref(null)
// 懒加载观察器 / giscus 的 <script> 引用 / 重建令牌（防异步竞态）
let observer = null
let scriptEl = null
let loadToken = 0
let themeToken = 0

// 主题文件版本号：public/giscus/*.css 改动后递增，避免老访客浏览器复用已缓存的旧主题
const THEME_VERSION = '2'

// 当前主题名：与站点明暗同源（VitePress 把 .dark 挂在 <html> 上，isDark 随其响应式变化）
const themeName = () => (isDark.value ? 'dark' : 'light')

// 主题文件地址：giscus 只接受「内置主题名」或「外部 CSS 的绝对 URL」，所以必须拼成绝对地址；
// 用 site.base 拼接，将来部署到子路径（base: '/blog/'）也无需改动
function themeFileUrl(name) {
  const url = new URL(`${site.value.base}giscus/${name}.css`, window.location.origin)
  url.searchParams.set('v', THEME_VERSION)
  return url.href
}

// btoa 只接受 Latin-1，而主题文件里全是中文注释，所以先逐字节转成二进制字符串
function toBase64(text) {
  let binary = ''
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte)
  return btoa(binary)
}

// 线上（https）走真实 URL；本地 http 预览时 giscus.app 抓不到 localhost（混合内容会被拦），
// 于是直接读同一份 CSS 转成 data: 地址内联交出去，保证本地与线上配色一致
async function themeUrl(name) {
  const url = themeFileUrl(name)
  if (window.location.protocol === 'https:') return url
  try {
    const response = await fetch(url)
    if (!response.ok) return url
    return `data:text/css;base64,${toBase64(await response.text())}`
  } catch {
    return url
  }
}

// Giscus 配置项（从 kratos.giscus 读取），repo 为空则不启用评论
const options = computed(() => theme.value.kratos?.giscus || {})
const enabled = computed(
  () => Boolean(options.value.repo && options.value.repoId),
)

// 加载 Giscus iframe 到容器（每次重建，保证路由切换后评论对应当前页面）
async function loadGiscus() {
  const container = giscusRef.value
  if (!container || !enabled.value) return

  // 主题先取到再插脚本，否则 giscus 会先用内置主题渲染一次再被切走，出现颜色闪动
  const token = ++loadToken
  const theme = await themeUrl(themeName())
  // 等待期间若发生重建 / 卸载，丢弃这次结果
  if (token !== loadToken || giscusRef.value !== container) return

  container.replaceChildren()
  const o = options.value
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('data-repo', o.repo)
  script.setAttribute('data-repo-id', o.repoId)
  script.setAttribute('data-category', o.category || '')
  script.setAttribute('data-category-id', o.categoryId || '')
  script.setAttribute('data-mapping', o.mapping || 'pathname')
  script.setAttribute('data-strict', o.strict != null ? String(o.strict) : '0')
  script.setAttribute(
    'data-reactions-enabled',
    o.reactionsEnabled != null ? String(o.reactionsEnabled) : '1',
  )
  script.setAttribute(
    'data-emit-metadata',
    o.emitMetadata != null ? String(o.emitMetadata) : '0',
  )
  script.setAttribute('data-input-position', o.inputPosition || 'top')
  script.setAttribute('data-theme', theme)
  script.setAttribute('data-lang', o.lang || 'zh-CN')
  script.setAttribute('data-loading', 'lazy')
  // 记住脚本节点：giscus 初始化只读一次 data-theme，后续切换先改它再 postMessage
  scriptEl = script
  container.appendChild(script)
}

// 评论区接近视口（提前 400px）才注入 giscus 脚本，首屏不下载第三方资源
function observeAndLoad() {
  const container = giscusRef.value
  if (!container || !enabled.value) return
  // 作废在途的加载并清空旧 iframe，保证路由切换后评论对应当前页面
  loadToken++
  scriptEl = null
  container.replaceChildren()
  observer?.disconnect()
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer?.disconnect()
          observer = null
          loadGiscus()
        }
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(container)
  } else {
    loadGiscus()
  }
}

// 主题切换：把新的主题 URL 推给 iframe，评论区无需刷新即可跟随站点明暗
// 注意 setConfig 的 theme 同样只接受 URL（不能直接给 'dark' / 'light'）
async function syncGiscusTheme() {
  const token = ++themeToken
  const theme = await themeUrl(themeName())
  // 快速连点时的「后发先至」保护：只采用最后一次请求的结果
  if (token !== themeToken) return
  // 脚本仍在加载（iframe 还没生成）时先改 data-theme，giscus 初始化时会直接读它
  if (scriptEl) scriptEl.dataset.theme = theme
  const iframe = giscusRef.value?.querySelector('iframe.giscus-frame')
  iframe?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, 'https://giscus.app')
}

onMounted(() => {
  observeAndLoad()
})

// SPA 内部路由切换时，重建评论（对应新页面路径），并重新观察滚动位置
watch(
  () => route.path,
  () => {
    observeAndLoad()
  },
)

// 明暗切换时同步评论主题（站点主题按钮走 VitePress appearance，isDark 会响应式变化）
watch(isDark, () => {
  if (!enabled.value) return
  syncGiscusTheme()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  // 作废在途的异步结果，避免卸载后回写
  loadToken++
  themeToken++
  scriptEl = null
  giscusRef.value?.replaceChildren()
})
</script>

<template>
  <div v-if="enabled" class="giscus-wrapper">
    <div ref="giscusRef" class="giscus-container"></div>
  </div>
</template>
