import Layout from './Layout.vue'
import Icon from './components/Icon.vue'
import PostCardList from './components/PostCardList.vue'
import './styles/index.css'

// Kratos VitePress 主题入口
export default {
  Layout,
  enhanceApp({ app }) {
    // 全局注册图标组件
    app.component('KIcon', Icon)
    // 全局注册目录文章列表组件（用于 posts/<dir>/index.md 中渲染该目录的文章卡片）
    app.component('PostCardList', PostCardList)
  },
}
