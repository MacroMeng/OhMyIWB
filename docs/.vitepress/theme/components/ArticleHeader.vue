<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page, theme } = useData()

const title = computed(() => page.value.frontmatter.title || '文章')
const date = computed(() => {
  const d = new Date(page.value.frontmatter.date)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}年${m}月${day}日`
})
const tags = computed(() => page.value.frontmatter.tags || [])
const author = computed(() => page.value.frontmatter.author || theme.value.kratos?.about?.name || 'Kratos')
</script>

<template>
  <div class="article-panel article-head">
    <h1 class="article-title">{{ title }}</h1>
    <div class="article-meta">
      <span v-if="date" class="meta-item"><KIcon name="calendar" />{{ date }}</span>
      <span class="meta-item"><KIcon name="author" />{{ author }}</span>
      <a v-for="tag in tags" :key="tag" class="tag-link" :href="`/?tag=${encodeURIComponent(tag)}`">
        <KIcon name="tag" />{{ tag }}
      </a>
    </div>
  </div>
</template>
