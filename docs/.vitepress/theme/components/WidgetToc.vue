<script setup>
import { useToc } from '../composables/toc.js'

const { headings, activeId, scrollTo } = useToc()
</script>

<template>
  <div v-if="headings.length" class="widget widget-toc">
    <div class="title">文章目录</div>
    <nav class="toc-list">
      <a
        v-for="h in headings"
        :key="h.id"
        class="toc-link"
        :class="[`level-${h.level}`, { active: activeId === h.id }]"
        href="javascript:;"
        @click="scrollTo(h.id)"
      >{{ h.text }}</a>
    </nav>
  </div>
</template>