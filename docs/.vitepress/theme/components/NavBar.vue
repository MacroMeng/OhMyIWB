<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData, useRoute, useRouter } from 'vitepress'
import { useToc } from '../composables/toc.js'
import SideBar from './SideBar.vue'
import NavSearch from './NavSearch.vue'

const { theme, isDark } = useData()
const route = useRoute()
const router = useRouter()

const scrolled = ref(false)
const menuOpen = ref(false)
const tocOpen = ref(false)
const widgetsOpen = ref(false)

const { headings, activeId, scrollTo } = useToc()

const navs = computed(() => theme.value.nav || [])
const brand = computed(() => theme.value.kratos?.brand || {})
// 文章详情页：posts 下的真实文章（排除目录根页面 /posts/<dir>/）
const isPost = computed(() => {
  const p = route.path
  return p.startsWith('/posts/') && !/\/posts\/[^/]+\/?$/.test(p)
})

// 首页为 Banner 模式：导航初始透明叠加在 Banner 上，滚动后变为深色
const isBannerMode = computed(() => route.path === '/')

const navClass = computed(() => ({
  scrolled: scrolled.value,
  'banner-mode': isBannerMode.value && !scrolled.value,
}))

function onScroll() {
  scrolled.value = window.scrollY > 40
}

function isActive(item) {
  if (item.link === '/') return route.path === '/'
  return item.link && route.path.startsWith(item.link)
}

function go(link) {
  menuOpen.value = false
  tocOpen.value = false
  widgetsOpen.value = false
  router.go(link)
}

function goToHeading(id) {
  tocOpen.value = false
  widgetsOpen.value = false
  scrollTo(id)
}

// 主题三态切换：跟随设备(auto) → 固定暗色 → 固定亮色 → 跟随设备
// VueUse useDark 的 setter 有"智能 auto"（写入值与系统一致时被吞成 auto），无法表达三态，
// 因此直接写 localStorage 并派发 StorageEvent，VueUse useStorage 会同步响应式状态（isDark / html.dark）
const APPEARANCE_KEY = 'vitepress-theme-appearance'
const hydrated = ref(false)
const appearanceMode = ref('auto')

function readAppearanceMode() {
  if (typeof window === 'undefined') return 'auto'
  const v = localStorage.getItem(APPEARANCE_KEY)
  return v === 'dark' || v === 'light' ? v : 'auto'
}

function applyAppearance(mode) {
  if (typeof window === 'undefined') return
  localStorage.setItem(APPEARANCE_KEY, mode)
  window.dispatchEvent(new StorageEvent('storage', {
    key: APPEARANCE_KEY,
    newValue: mode,
    storageArea: localStorage,
  }))
  appearanceMode.value = mode
}

function cycleAppearance() {
  const order = ['auto', 'dark', 'light']
  const cur = readAppearanceMode()
  applyAppearance(order[(order.indexOf(cur) + 1) % order.length])
}

// 多标签页同步：其他标签页切换主题时刷新当前模式指示
function onStorage(e) {
  if (e.key === APPEARANCE_KEY) appearanceMode.value = readAppearanceMode()
}

const themeModeLabel = computed(() => {
  if (appearanceMode.value === 'auto') {
    return `跟随设备（当前${isDark.value ? '暗色' : '浅色'}）· 点击切换`
  }
  return `固定${appearanceMode.value === 'dark' ? '暗色' : '浅色'} · 点击切换`
})

function onDocClick(e) {
  if (!e.target.closest('.k-nav, .nav-widgets-drawer')) {
    menuOpen.value = false
    tocOpen.value = false
    widgetsOpen.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    tocOpen.value = false
    widgetsOpen.value = false
  }
}

onMounted(() => {
  hydrated.value = true
  appearanceMode.value = readAppearanceMode()
  window.addEventListener('storage', onStorage)
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
  onScroll()
})
onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorage)
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <nav class="k-nav" :class="navClass">
    <div class="container nav-inner">
      <a class="navbar-brand" href="/" @click="go('/')">
        <img v-if="brand.logo" class="brand-logo" :src="brand.logo" :alt="brand.name" />
        <span v-else class="brand-name">{{ brand.name || 'Kratos' }}</span>
      </a>

      <button
        class="navbar-toggler"
        type="button"
        :aria-expanded="menuOpen"
        aria-label="切换导航菜单"
        @click="menuOpen = !menuOpen; tocOpen = false; widgetsOpen = false"
      >
        <span class="line"></span>
        <span class="line"></span>
        <span class="line"></span>
      </button>

      <ul class="navbar-nav" :class="{ show: menuOpen }">
        <li v-for="item in navs" :key="item.text" class="nav-item">
          <a
            v-if="!item.items"
            class="nav-link"
            :class="{ active: isActive(item) }"
            :href="item.link"
            @click="go(item.link)"
          >{{ item.text }}</a>
          <div v-else class="has-dropdown">
            <a class="nav-link" :class="{ active: isActive(item) }" :href="item.link || '#'" @click="go(item.link)">{{ item.text }}</a>
            <ul class="dropdown">
              <li v-for="sub in item.items" :key="sub.text">
                <a :href="sub.link" @click="go(sub.link)">{{ sub.text }}</a>
              </li>
            </ul>
          </div>
        </li>
      </ul>

      <!-- 顶栏搜索：桌面端输入框 / 移动端搜索按钮 -->
      <NavSearch />

      <!-- 主题三态切换：跟随设备 / 固定暗色 / 固定亮色 -->
      <button
        class="nav-theme-toggler"
        :class="{ 'theme-follow': hydrated && appearanceMode === 'auto' }"
        type="button"
        :aria-label="!hydrated ? '切换主题' : themeModeLabel"
        :title="!hydrated ? '切换主题' : themeModeLabel"
        @click="cycleAppearance"
      >
        <KIcon :name="isDark ? 'moon' : 'sun'" />
      </button>

      <!-- 移动端侧栏按钮：整合所有小工具 -->
      <button
        class="nav-widgets-toggler"
        :class="{ open: widgetsOpen }"
        type="button"
        aria-label="侧边栏"
        @click="widgetsOpen = !widgetsOpen; menuOpen = false; tocOpen = false"
      >
        <KIcon name="sidebar" />
        <span class="widgets-text">侧栏</span>
      </button>

      <!-- 移动端目录按钮：文章页显示 -->
      <button
        v-if="isPost"
        class="nav-toc-toggler"
        :class="{ open: tocOpen }"
        type="button"
        aria-label="文章目录"
        @click="tocOpen = !tocOpen; menuOpen = false; widgetsOpen = false"
      >
        <KIcon name="list" />
        <span class="toc-text">目录</span>
        <span v-if="headings.length" class="toc-count">{{ headings.length }}</span>
      </button>

      <!-- 移动端目录面板 -->
      <transition name="k-toc">
        <div v-if="tocOpen && headings.length" class="nav-toc-panel" @click.stop>
          <div class="nav-toc-title">文章目录</div>
          <nav class="nav-toc-list">
            <a
              v-for="h in headings"
              :key="h.id"
              class="nav-toc-link"
              :class="[`level-${h.level}`, { active: activeId === h.id }]"
              href="javascript:;"
              @click="goToHeading(h.id)"
            >{{ h.text }}</a>
          </nav>
        </div>
      </transition>
    </div>
  </nav>

  <!-- 移动端侧栏抽屉 -->
  <transition name="k-drawer">
    <div v-if="widgetsOpen" class="drawer-overlay" @click="widgetsOpen = false"></div>
  </transition>
  <transition name="k-drawer-slide">
    <aside v-if="widgetsOpen" class="nav-widgets-drawer" @click.stop>
      <div class="drawer-header">
        <span class="drawer-title">
          <KIcon name="sidebar" />
          站点侧栏
        </span>
        <button class="drawer-close" type="button" aria-label="关闭侧栏" @click="widgetsOpen = false">
          <KIcon name="x" />
        </button>
      </div>
      <div class="drawer-body">
        <SideBar :is-post="isPost" />
      </div>
    </aside>
  </transition>
</template>