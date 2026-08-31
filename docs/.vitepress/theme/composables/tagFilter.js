import { ref } from 'vue'

/**
 * 全局标签筛选状态
 * WidgetTags（标签聚合）与 PostList（文章列表）通过共享 ref 联动，
 * 不依赖 VitePress 路由（其 route 对象不暴露 query，path 不变时 watch 不触发）
 */
export const activeTag = ref('')

// 初始化：从 URL 参数恢复（支持刷新后保留筛选状态）
if (typeof window !== 'undefined') {
  activeTag.value = new URLSearchParams(window.location.search).get('tag') || ''
}

/**
 * 设置当前筛选标签。
 * 同步更新内存状态与地址栏 URL（replaceState 不触发页面重载）
 */
export function setActiveTag(tag) {
  activeTag.value = tag || ''
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    if (tag) {
      url.searchParams.set('tag', tag)
    } else {
      url.searchParams.delete('tag')
    }
    window.history.replaceState(null, '', url.pathname + url.search)
  }
}
