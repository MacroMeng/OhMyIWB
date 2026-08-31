<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import WidgetAbout from './WidgetAbout.vue'
import WidgetTags from './WidgetTags.vue'
import WidgetPosts from './WidgetPosts.vue'
import WidgetSearch from './WidgetSearch.vue'
import WidgetToc from './WidgetToc.vue'

const props = defineProps({
  isPost: { type: Boolean, default: false },
})

const { theme } = useData()
const widgets = computed(() => theme.value.kratos?.widgets || {})
</script>

<template>
  <aside class="widget-area">
    <WidgetToc v-if="isPost && widgets.toc" />
    <WidgetSearch v-if="widgets.search" />
    <WidgetAbout v-if="widgets.about" />
    <WidgetTags v-if="widgets.tags" />
    <WidgetPosts v-if="widgets.posts" />
  </aside>
</template>
