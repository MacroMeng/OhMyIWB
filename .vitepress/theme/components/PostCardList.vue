<script setup lang="ts">
import { computed } from "vue";
import { usePosts, TkHomePostItemCard } from "vitepress-theme-teek";

const props = defineProps<{ path: string; title?: string }>();

const posts = usePosts();
// sortPostsByDate 已排除 article: false 的页面，所以目录页自身不会出现在列表里
const list = computed(() =>
  posts.value.sortPostsByDate.filter(post => post.url.startsWith(`/${props.path}/`))
);
</script>

<template>
  <div class="omi-post-cards">
    <div v-if="title" class="omi-post-cards__header">
      <h2>{{ title }}</h2>
      <span class="count">{{ list.length }} 篇</span>
    </div>

    <div class="tk-post is-card">
      <ul>
        <li v-for="post in list" :key="post.url">
          <TkHomePostItemCard :post="post" />
        </li>
      </ul>
    </div>
  </div>
</template>
