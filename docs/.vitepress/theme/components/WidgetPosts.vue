<script setup>
import { computed } from 'vue'
import { data as posts } from '../posts.data.js'

const latest = computed(() => posts.slice(0, 8))

function formatDate(d) {
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
</script>

<template>
  <div class="widget widget-posts">
    <div class="title">文章聚合</div>
    <ul class="post-list">
      <li v-for="post in latest" :key="post.url" class="post-item">
        <a class="post-link" :href="post.url">
          <span class="post-title">{{ post.frontmatter.title }}</span>
          <span class="post-date">
            <KIcon name="clock" />{{ formatDate(post.frontmatter.date) }}
          </span>
        </a>
      </li>
    </ul>
  </div>
</template>
