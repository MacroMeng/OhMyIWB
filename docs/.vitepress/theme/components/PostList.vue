<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { data as posts } from '../posts.data.js'
import PostCard from './PostCard.vue'
import { activeTag } from '../composables/tagFilter.js'

const props = defineProps({
  // posts 下的一级子目录名，为空表示全部文章（如首页）
  dir: { type: String, default: '' },
  // 列表头部标题，为空时自动显示（最新文章 / 标签筛选）
  title: { type: String, default: '' },
})

const perPageMobile = 6
const currentPage = ref(1)

// 标签筛选状态由 WidgetTags 共享（composables/tagFilter.js）
// 目录筛选（dir）优先，再叠加标签筛选
const filtered = computed(() => {
  let list = props.dir ? posts.filter((p) => p.dir === props.dir) : posts
  if (activeTag.value) {
    list = list.filter((p) => (p.frontmatter.tags || []).includes(activeTag.value))
  }
  return list
})

const headTitle = computed(() => {
  const tagPart = activeTag.value ? `标签筛选：${activeTag.value}` : ''
  if (props.title) return tagPart ? `${props.title} · ${tagPart}` : props.title
  return tagPart || '最新文章'
})

// 筛选标签变化时回到第一页
watch(activeTag, () => {
  currentPage.value = 1
})

// 桌面端（≥992px）瀑布流一次性展示全部；移动端按每页 6 篇分页
const isDesktop = ref(true)
let mq = null
function updateViewport() {
  isDesktop.value = mq ? mq.matches : true
  const maxPage = Math.max(1, Math.ceil(filtered.value.length / perPageMobile))
  if (currentPage.value > maxPage) currentPage.value = maxPage
}
onMounted(() => {
  mq = window.matchMedia('(min-width: 992px)')
  mq.addEventListener('change', updateViewport)
  updateViewport()
})
onBeforeUnmount(() => {
  if (mq) mq.removeEventListener('change', updateViewport)
})

const pageCount = computed(() =>
  isDesktop.value
    ? 1
    : Math.max(1, Math.ceil(filtered.value.length / perPageMobile)),
)
const paged = computed(() => {
  if (isDesktop.value) return filtered.value
  return filtered.value.slice(
    (currentPage.value - 1) * perPageMobile,
    currentPage.value * perPageMobile,
  )
})

function goPage(p) {
  if (p < 1 || p > pageCount.value) return
  currentPage.value = p
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="post-list">
    <!-- 文章聚合头部 -->
    <div class="article-panel list-head">
      <div class="search-title">{{ headTitle }}</div>
    </div>

    <!-- 瀑布流文章卡片 -->
    <div class="masonry">
      <PostCard v-for="(post, i) in paged" :key="post.url" :post="post" :index="i" />
    </div>

    <!-- 没有内容 -->
    <div v-if="!paged.length" class="article-panel">
      <div class="nothing">
        <div class="nothing-icon"><KIcon name="search" /></div>
        <div class="sorry">很抱歉，没有找到相关文章</div>
      </div>
    </div>

    <!-- 分页（仅移动端；桌面瀑布流一次性展示全部） -->
    <nav v-if="!isDesktop && pageCount > 1" class="pagelist">
      <a
        class="prev"
        :class="{ disabled: currentPage === 1 }"
        href="javascript:;"
        aria-label="上一页"
        @click="goPage(currentPage - 1)"
      ><KIcon name="chevron-left" /></a>
      <select
        class="page-select"
        :value="currentPage"
        aria-label="选择页码"
        @change="goPage(Number($event.target.value))"
      >
        <option v-for="p in pageCount" :key="p" :value="p">
          第 {{ p }} / {{ pageCount }} 页
        </option>
      </select>
      <a
        class="next"
        :class="{ disabled: currentPage === pageCount }"
        href="javascript:;"
        aria-label="下一页"
        @click="goPage(currentPage + 1)"
      ><KIcon name="chevron-right" /></a>
    </nav>
  </div>
</template>
