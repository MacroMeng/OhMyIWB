<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vitepress'
import { data as posts } from '../posts.data.js'

const router = useRouter()

const keyword = ref('')
const focused = ref(false)

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
  focused.value = false
  router.go(url)
}
</script>

<template>
  <div class="widget widget-search">
    <div class="title">搜索</div>
    <div class="search-box">
      <KIcon name="search" class="search-icon" />
      <input
        v-model="keyword"
        class="search-input"
        type="text"
        placeholder="搜点什么呢?"
        @focus="focused = true"
        @blur="focused = false"
      />
    </div>
    <ul v-if="keyword && results.length" class="search-results" @mousedown.prevent>
      <li v-for="post in results" :key="post.url">
        <a :href="post.url" @click="go(post.url)">
          <span class="result-title">{{ post.frontmatter.title }}</span>
          <span class="result-tag">{{ (post.frontmatter.tags || [])[0] || '文章' }}</span>
        </a>
      </li>
    </ul>
    <div v-else-if="keyword" class="search-empty">没有找到相关内容</div>
  </div>
</template>
