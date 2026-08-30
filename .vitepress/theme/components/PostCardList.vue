<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import {
  usePosts,
  useTeekConfig,
  useWindowSize,
  TkHomePostItemCard,
  TkPagination,
} from "vitepress-theme-teek";

const props = defineProps<{ path: string; title?: string; pageSize?: number }>();

const posts = usePosts();
const { getTeekConfigRef } = useTeekConfig();
const pageConfig = getTeekConfigRef<{ pageSize?: number }>("page", {});
// 未显式传入时跟随主题的 page.pageSize，与首页保持同一档分页粒度
const pageSize = computed(() => props.pageSize ?? pageConfig.value.pageSize ?? 24);

// sortPostsByDate 已排除 article: false 的页面，所以目录页自身不会出现在列表里
const list = computed(() =>
  posts.value.sortPostsByDate.filter(post => post.url.startsWith(`/${props.path}/`))
);

const pageNum = ref(1);
const currentPosts = computed(() =>
  list.value.slice((pageNum.value - 1) * pageSize.value, pageNum.value * pageSize.value)
);

watch([list, pageSize], () => (pageNum.value = 1));

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
    <nav v-if="title" class="omi-post-cards__breadcrumb" aria-label="面包屑">
      <a href="/">首页</a>
      <span class="sep" aria-hidden="true">/</span>
      <span class="current" aria-current="page">{{ title }}</span>
    </nav>

    <div v-if="title" class="omi-post-cards__header">
      <h1>{{ title }}</h1>
      <span class="count">{{ list.length }} 篇</span>
    </div>

    <div class="omi-post-cards__body">
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
  </div>
</template>
