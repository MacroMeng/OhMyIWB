<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const { theme, isDark } = useData()
const route = useRoute()

const giscusRef = ref(null)

// Giscus 配置项（从 kratos.giscus 读取），repo 为空则不启用评论
const options = computed(() => theme.value.kratos?.giscus || {})
const enabled = computed(
  () => Boolean(options.value.repo && options.value.repoId),
)

// 加载 Giscus iframe 到容器（每次重建，保证路由切换后评论对应当前页面）
function loadGiscus() {
  const container = giscusRef.value
  if (!container || !enabled.value) return

  container.innerHTML = ''
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
  script.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  script.setAttribute('data-lang', o.lang || 'zh-CN')
  script.setAttribute('data-loading', 'lazy')
  container.appendChild(script)
}

// 主题切换：通过 postMessage 让 giscus 无刷新跟随明暗模式
function syncGiscusTheme() {
  const iframe = document.querySelector('iframe.giscus-frame')
  if (!iframe) return
  iframe.contentWindow?.postMessage(
    {
      giscus: {
        setConfig: { theme: isDark.value ? 'dark' : 'light' },
      },
    },
    'https://giscus.app',
  )
}

onMounted(() => {
  if (enabled.value) loadGiscus()
})

// SPA 内部路由切换时，重建评论（对应新页面路径）
watch(
  () => route.path,
  () => {
    if (enabled.value) loadGiscus()
  },
)

// 明暗切换时同步评论主题
watch(isDark, () => {
  if (!enabled.value) return
  // 等待 giscus 加载完成后再发送主题消息
  setTimeout(syncGiscusTheme, 150)
  // 若尚未加载则直接重建（新主题渲染）
  const container = giscusRef.value
  if (container && container.childElementCount === 0) {
    loadGiscus()
  }
})

onBeforeUnmount(() => {
  const container = giscusRef.value
  if (container) container.innerHTML = ''
})
</script>

<template>
  <div v-if="enabled" class="giscus-wrapper">
    <div ref="giscusRef" class="giscus-container"></div>
  </div>
</template>
