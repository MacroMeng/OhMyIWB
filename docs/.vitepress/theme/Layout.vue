<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'
import NavBar from './components/NavBar.vue'
import ProgressBar from './components/ProgressBar.vue'
import Banner from './components/Banner.vue'
import PostList from './components/PostList.vue'
import ArticleHeader from './components/ArticleHeader.vue'
import Giscus from './components/Giscus.vue'
import SideBar from './components/SideBar.vue'
import FooterBar from './components/FooterBar.vue'
import ToolBox from './components/ToolBox.vue'

const { page, frontmatter } = useData()

// 首页（layout: home）显示文章卡片列表
const isHome = computed(() => frontmatter.value.layout === 'home')
// 文章详情页（docs/posts 目录下）
// 排除目录索引页：posts/<dir>/index.md（article: false，用 PostCardList 渲染列表而非正文）
const isPost = computed(() => {
  if (!page.value.relativePath?.startsWith('posts/')) return false
  if (page.value.frontmatter?.article === false) return false
  if (/\/index\.md$/.test(page.value.relativePath)) return false
  return true
})
// 404 页面：不显示侧边栏，只显示友好提示
const isNotFound = computed(() => page.value.isNotFound === true)
// 目录索引页：posts/<dir>/index.md，用 PostCardList 渲染文章列表，不套文章卡片背景
const isDirIndex = computed(() => {
  if (!page.value.relativePath?.startsWith('posts/')) return false
  return /\/index\.md$/.test(page.value.relativePath)
})
</script>

<template>
  <div class="kratos-theme">
    <ProgressBar />
    <NavBar />
    <Banner v-if="isHome" />

    <main v-if="isNotFound" class="k-main no-banner">
      <div class="container">
        <div class="row">
          <div class="col-12">
            <article class="article-panel">
              <div class="kratos-404">
                <div class="code">404</div>
                <p class="text">你访问的页面不存在或已被移除</p>
                <a class="btn-home" href="/">返回首页</a>
              </div>
            </article>
          </div>
        </div>
      </div>
    </main>

    <main v-else class="k-main" :class="isHome ? 'has-banner' : 'no-banner'">
      <div class="container">
        <div class="row">
          <div class="col-lg-8 board">
            <PostList v-if="isHome" />
            <template v-else>
              <ArticleHeader v-if="isPost" />
              <!-- 文章详情页：卡片背景 + 评论 -->
              <article v-if="isPost" class="article-panel article-detail">
                <div class="vp-doc">
                  <Content />
                </div>
                <!-- 文章评论：Giscus（在 kratos.giscus 中配置后启用） -->
                <Giscus />
              </article>
              <!-- 目录索引页（posts/<dir>/index.md）：列表直接铺开，无卡片背景 -->
              <div v-else-if="isDirIndex" class="dir-index">
                <Content />
              </div>
              <!-- 普通页面（如 about）：保留卡片背景 -->
              <article v-else class="article-panel article-detail">
                <div class="vp-doc">
                  <Content />
                </div>
              </article>
            </template>
          </div>
          <div class="col-lg-4 sidebar sticky-sidebar">
            <SideBar :is-post="isPost" />
          </div>
        </div>
      </div>
    </main>

    <FooterBar />
    <ToolBox />
  </div>
</template>
