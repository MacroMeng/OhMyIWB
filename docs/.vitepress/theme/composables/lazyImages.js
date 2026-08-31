import { nextTick, onMounted, watch } from 'vue'
import { useData } from 'vitepress'

/**
 * 正文图片懒加载兜底（组合式函数）
 *
 * markdown 语法图片在构建期已由 markdown-it 渲染器添加
 * loading="lazy" + decoding="async"；
 * 此处对文章/页面中「手写 HTML <img>」做运行时补充，
 * 统一补上这两个属性。
 *
 * 说明：loading="lazy" 对视口内的图片不会延迟加载（浏览器
 * 仍会立即加载首屏图），因此给所有正文图片加 lazy 是安全的。
 */
export function useLazyImages() {
  const { page } = useData()

  function applyLazy() {
    const doc = document.querySelector('.article-detail')
    if (!doc) return
    doc.querySelectorAll('.vp-doc img').forEach((img) => {
      if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy')
      if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async')
    })
  }

  async function refresh() {
    await nextTick()
    applyLazy()
  }

  watch(() => page.value.relativePath, refresh)
  onMounted(refresh)
}
