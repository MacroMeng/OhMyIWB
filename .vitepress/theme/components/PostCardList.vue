<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { usePosts, useWindowSize, TkHomePostItemCard, TkPagination } from "vitepress-theme-teek";

const props = withDefaults(defineProps<{ path: string; title?: string; pageSize?: number }>(), {
  pageSize: 12,
});

const posts = usePosts();
// sortPostsByDate 已排除 article: false 的页面，所以目录页自身不会出现在列表里
const list = computed(() =>
  posts.value.sortPostsByDate.filter(post => post.url.startsWith(`/${props.path}/`))
);

const pageNum = ref(1);
const currentPosts = computed(() =>
  list.value.slice((pageNum.value - 1) * props.pageSize, pageNum.value * props.pageSize)
);

watch(list, () => (pageNum.value = 1));

const pageProps = reactive<{ size: "default" | "small"; layout: string }>({
  size: "default",
  layout: "prev, pager, next, jumper, ->, total",
});
// 与主题首页一致：窄屏收窄分页器，否则会溢出
useWindowSize(width => {
  pageProps.size = width <= 768 ? "small" : "default";
  pageProps.layout = width <= 960 ? "prev, pager, next" : "prev, pager, next, jumper, ->, total";
});

const handlePagination = () => {
  nextTick(() => window.scrollTo({ top: 0, behavior: "smooth" }));
};
</script>

<template>
  <div class="omi-post-cards">
    <div v-if="title" class="omi-post-cards__header">
      <h2>{{ title }}</h2>
      <span class="count">{{ list.length }} 篇</span>
    </div>

    <div class="tk-post is-card">
      <ul>
        <li v-for="post in currentPosts" :key="post.url">
          <TkHomePostItemCard :post="post" />
        </li>
      </ul>
    </div>

    <div v-if="list.length > pageSize" class="omi-post-cards__pagination flx-justify-center">
      <TkPagination
        v-bind="pageProps"
        v-model:current-page="pageNum"
        :page-size="pageSize"
        :total="list.length"
        background
        @current-change="handlePagination"
      />
    </div>
  </div>
</template>
