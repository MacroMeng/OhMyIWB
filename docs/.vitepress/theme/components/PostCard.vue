<script setup>
import { computed } from 'vue'

const props = defineProps({
  post: { type: Object, required: true },
  index: { type: Number, default: 0 },
})

// 有封面图（frontmatter.image）才展示缩略图；无图卡片为纯文字卡片
const hasCover = computed(() => !!props.post.frontmatter.image)
const cover = computed(() => props.post.frontmatter.image || '')
const category = computed(() => props.post.frontmatter.category || '随笔')
const title = computed(() => props.post.frontmatter.title || '无标题')
const tags = computed(() => props.post.frontmatter.tags || [])
const date = computed(() => {
  const d = new Date(props.post.frontmatter.date)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})
const readingTime = computed(() => props.post.readingTime || 1)

// 摘要：优先 frontmatter.description，否则从 excerpt 提取纯文本
const summary = computed(() => {
  const desc = props.post.frontmatter.description
  if (desc) return desc
  if (props.post.excerpt) {
    // 剥离 HTML 标签与空白，得到干净的纯文本摘要
    const text = props.post.excerpt
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text
  }
  return '这篇文章还没有摘要，点击阅读全文了解更多内容。'
})

// 瀑布流封面：按顺序轮换不同的宽高比，让卡片高度错落有致
const aspectRatios = ['ratio-16-9', 'ratio-3-2', 'ratio-1-1', 'ratio-4-3', 'ratio-2-1']
const aspectClass = computed(() => aspectRatios[props.index % aspectRatios.length])
</script>

<template>
  <div class="article-panel masonry-card">
    <div class="a-thumb" v-if="hasCover" :class="aspectClass">
      <a :href="post.url">
        <img :src="cover" :alt="title" loading="lazy" />
      </a>
      <span class="label">
        {{ category }}<i class="label-arrow"></i>
      </span>
    </div>
    <div class="a-post">
      <h3 class="title">
        <a :href="post.url">{{ title }}</a>
      </h3>
      <div class="content">
        <p :class="{ 'summary-full': post.hasMore }">{{ summary }}</p>
      </div>
    </div>
    <div class="a-meta">
      <span class="meta-left">
        <span v-if="date" class="meta-item"><KIcon name="calendar" />{{ date }}</span>
        <span class="meta-item"><KIcon name="clock" />{{ readingTime }} 分钟阅读</span>
      </span>
      <span class="meta-right">
        <a class="read-more" :href="post.url">阅读全文<KIcon name="arrow-right" /></a>
      </span>
    </div>
  </div>
</template>
