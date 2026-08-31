<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vitepress'
import { data as posts } from '../posts.data.js'

const router = useRouter()

const showTop = ref(false)
const searchOpen = ref(false)
const keyword = ref('')

const results = () => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return []
  return posts
    .filter((p) => (p.frontmatter.title || '').toLowerCase().includes(kw))
    .slice(0, 6)
}

function onScroll() {
  showTop.value = window.scrollY > 300
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function go(url) {
  keyword.value = ''
  searchOpen.value = false
  router.go(url)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="f-toolbox">
    <div v-show="showTop" class="tool gotop" title="回到顶部" @click="toTop">
      <KIcon name="arrow-up" />
    </div>
    <div class="tool search" :class="{ open: searchOpen }" title="搜索" @click="searchOpen = !searchOpen">
      <KIcon name="search" />
    </div>
    <div v-if="searchOpen" class="search-panel" @mousedown.prevent>
      <div class="search-panel-input">
        <KIcon name="search" />
        <input v-model="keyword" type="text" placeholder="搜点什么呢?" autofocus />
      </div>
      <ul v-if="keyword" class="search-panel-list">
        <li v-for="post in results()" :key="post.url">
          <a :href="post.url" @click="go(post.url)">{{ post.frontmatter.title }}</a>
        </li>
        <li v-if="!results().length" class="no-result">没有找到相关内容</li>
      </ul>
    </div>
  </div>
</template>
