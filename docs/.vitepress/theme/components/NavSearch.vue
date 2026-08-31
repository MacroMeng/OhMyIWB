<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vitepress'
import { data as posts } from '../posts.data.js'

const router = useRouter()

const keyword = ref('')
const open = ref(false)
const mobileOpen = ref(false)

const results = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return []
  return posts
    .filter((p) => {
      const title = (p.frontmatter.title || '').toLowerCase()
      const tags = (p.frontmatter.tags || []).join(' ').toLowerCase()
      return title.includes(kw) || tags.includes(kw)
    })
    .slice(0, 6)
})

function go(url) {
  keyword.value = ''
  open.value = false
  mobileOpen.value = false
  router.go(url)
}

function closeMobile() {
  mobileOpen.value = false
  keyword.value = ''
}

function onDocClick(e) {
  if (!e.target.closest('.nav-search, .nav-search-mobile-panel')) {
    open.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    open.value = false
    mobileOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="nav-search">
    <!-- 桌面端：顶栏搜索框 -->
    <div class="nav-search-input">
      <KIcon name="search" class="nav-search-icon" />
      <input
        v-model="keyword"
        type="text"
        placeholder="搜索文章…"
        @focus="open = true"
        @blur="open = false"
      />
    </div>

    <!-- 移动端：搜索按钮 -->
    <button
      class="nav-search-toggler"
      type="button"
      aria-label="搜索"
      @click="mobileOpen = !mobileOpen"
    >
      <KIcon name="search" />
    </button>

    <!-- 桌面端下拉结果 -->
    <transition name="k-search-drop">
      <div v-if="open && keyword" class="nav-search-panel" @mousedown.prevent>
        <template v-if="results.length">
          <a
            v-for="post in results"
            :key="post.url"
            class="search-result"
            :href="post.url"
            @click="go(post.url)"
          >
            <span class="result-title">{{ post.frontmatter.title }}</span>
            <span class="result-tag">{{ (post.frontmatter.tags || [])[0] || '文章' }}</span>
          </a>
        </template>
        <div v-else class="search-empty">没有找到相关内容</div>
      </div>
    </transition>

    <!-- 移动端：全屏搜索面板 -->
    <transition name="k-search-mobile">
      <div v-if="mobileOpen" class="nav-search-mobile-panel" @mousedown.prevent>
        <div class="mobile-search-input">
          <KIcon name="search" class="nav-search-icon" />
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索文章…"
            autofocus
            @focus="open = true"
          />
          <button class="mobile-search-close" type="button" aria-label="关闭搜索" @click="closeMobile">
            <KIcon name="x" />
          </button>
        </div>
        <div class="mobile-search-results">
          <a
            v-for="post in results"
            :key="post.url"
            class="search-result"
            :href="post.url"
            @click="go(post.url)"
          >
            <span class="result-title">{{ post.frontmatter.title }}</span>
            <span class="result-tag">{{ (post.frontmatter.tags || [])[0] || '文章' }}</span>
          </a>
          <div v-if="keyword && !results.length" class="search-empty">没有找到相关内容</div>
          <div v-if="!keyword" class="search-empty">输入关键词搜索站内文章</div>
        </div>
      </div>
    </transition>
  </div>
</template>
