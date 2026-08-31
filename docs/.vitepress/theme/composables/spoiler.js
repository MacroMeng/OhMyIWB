import { onBeforeUnmount, onMounted } from 'vue'

/**
 * 黑幕点击交互（组合式函数）
 *
 * markdown-it 插件将 `>!文字!<` 渲染为 `.spoiler` 元素；
 * 默认遮盖内容，点击后切换显示（再点隐藏）。
 * 使用 document 级事件委托，SPA 路由切换后无需重新绑定。
 */
export function useSpoiler() {
  function toggle(el) {
    el.classList.toggle('clicked')
  }

  function onClick(e) {
    const el = e.target.closest('.spoiler')
    if (!el) return
    toggle(el)
  }

  // 键盘支持（span 已加 tabindex="0"）：Enter / 空格 切换
  function onKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const el = e.target.closest('.spoiler')
    if (!el) return
    e.preventDefault()
    toggle(el)
  }

  onMounted(() => {
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKeydown)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('click', onClick)
    document.removeEventListener('keydown', onKeydown)
  })
}
