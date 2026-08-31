<script setup>
import { computed } from 'vue'
import { data as posts } from '../posts.data.js'
import { activeTag, setActiveTag } from '../composables/tagFilter.js'

const tags = computed(() => {
  const map = new Map()
  posts.forEach((p) =>
    (p.frontmatter.tags || []).forEach((t) => map.set(t, (map.get(t) || 0) + 1)),
  )
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
})

function select(tag) {
  // 再次点击已激活的标签则取消筛选
  setActiveTag(activeTag.value === tag ? '' : tag)
}
</script>

<template>
  <div class="widget widget-tags">
    <div class="title">标签聚合</div>
    <div class="tag-cloud">
      <a
        v-for="[tag, count] in tags"
        :key="tag"
        class="tag-item"
        :class="{ active: activeTag === tag }"
        href="javascript:;"
        @click="select(tag)"
      >{{ tag }}<span class="tag-count">({{ count }})</span></a>
    </div>
  </div>
</template>
