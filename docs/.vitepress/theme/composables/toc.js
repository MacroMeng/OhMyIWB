import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'

/**
 * 文章目录逻辑（组合式函数）
 * 供桌面端侧边栏 WidgetToc 与移动端顶栏目录面板共同使用
 */
export function useToc() {
  const { page } = useData()
  const headings = ref([])
  const activeId = ref('')
  let observer = null
  let anchors = []

  function collectHeadings() {
    headings.value = []
    anchors = []
    const doc = document.querySelector('.article-detail')
    if (!doc) return
    const els = doc.querySelectorAll('h2, h3')
    els.forEach((el, index) => {
      let id = el.id
      if (!id) {
        id = `heading-${index}`
        el.id = id
      }
      headings.value.push({
        id,
        text: el.textContent.trim(),
        level: el.tagName === 'H2' ? 2 : 3,
      })
    })
  }

  function setupScrollSpy() {
    if (observer) observer.disconnect()
    if (!anchors.length) return
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activeId.value = entry.target.id
        })
      },
      { rootMargin: '-60px 0px -70% 0px', threshold: 0 },
    )
    anchors.forEach((el) => observer.observe(el))
  }

  async function refresh() {
    await nextTick()
    collectHeadings()
    anchors = headings.value.map((h) => document.getElementById(h.id)).filter(Boolean)
    setupScrollSpy()
  }

  function scrollTo(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  watch(() => page.value.relativePath, refresh)
  onMounted(refresh)
  onBeforeUnmount(() => {
    if (observer) observer.disconnect()
  })

  return { headings, activeId, scrollTo, refresh }
}