<script setup>
import PostList from './PostList.vue'

const props = defineProps({
  /** posts 下的一级子目录名（如 daily / thinklog），用于在目录根页面展示该目录文章列表 */
  path: { type: String, default: '' },
  /** 列表头部标题（如 OMI Daily），为空时自动显示 */
  title: { type: String, default: '' },
})
</script>

<template>
  <PostList :dir="props.path" :title="props.title" />
</template>
