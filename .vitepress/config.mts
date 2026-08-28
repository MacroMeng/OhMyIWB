import { defineConfig } from 'vitepress'
import { defineTeekConfig } from "vitepress-theme-teek/config"

// Teek 主题配置
export const teekConfig = defineTeekConfig({
  teekHome: true,
  vpHome: false,
  loading: "Loading OMI……",
  banner: {
    imgSrc: [
      "/assets/Poster.png"
    ],
    bgStyle: "fullImg",
    descStyle: "default",
    imgWaves: false,
    description: ["智在知互 · 思于识通"]
  },
  viewTransition: {
    enabled: true, // 是否启用深浅色切换动画效果
    mode: "out", // 动画模式，out 始终从点击点往全屏扩散，out-in 第一次从点击点往全屏扩散，再次点击从全屏回到点击点
    duration: 300, // 动画持续时间，当 mode 为 out 时，默认为 300ms，mode 为 out-in 时，默认为 600ms
    easing: "ease-out", // 缓动函数
  },
  backTop: {
    enabled: true, // 是否启动回到顶部功能
    content: "icon", // 回到顶部按钮的显示内容，可选配置 progress | icon
  },
  bodyBgImg: {},
  pageStyle: "segment-nav",
  themeEnhance: {
    hidden: true, // 隐藏主题增强面板，但下面的默认值仍然生效
    layoutSwitch: {
      defaultMode: "original"
    }
  },
  post: {
    postStyle: "card",
    coverImgMode: "full",
    showCapture: true, // 文章无 frontmatter.description 与 <!-- more -->，靠自动截取正文产生摘要
  },
  page: {
    pageSize: 24, // 卡片瀑布流单张较矮，一页放多些以压缩页数
  },
  comment: false,
  codeBlock: {
    enabled: true, // 是否启用新版代码块
    collapseHeight: false, // 超出高度后自动折叠，设置 true 则默认折叠，false 则默认不折叠
    overlay: false, // 代码块底部是否显示展开/折叠遮罩层
    langTextTransform: "none", // 语言文本显示样式，为 text-transform 的值:none, capitalize, lowercase, uppercase
  },
  author: {
    name: "OMI Authors", // 作者名称
    link: "https://github.com/MacroMeng/OhMyIWB", // 点击作者名称后跳转的链接
  },
  blogger: {
    name: "OhMyIWB", // 博主昵称
    slogan: "智在知互 · 思于识通", // 博主签名
    avatar: "/assets/CharacterOnly.png", // 博主头像
    shape: "circle", // 头像风格：square 为方形头像，circle 为圆形头像，circle-rotate 可支持鼠标悬停旋转，circle-rotate-last 将会持续旋转 59s
    circleBgImg: "/assets/Poster.png", // 背景图片
    circleBgMask: true, // 遮罩层是否显示，仅当 shape 为 circle 且 circleBgImg 配置时有效
    circleSize: 100, // 头像大小
    color: "#ffffff", // 字体颜色
    // 状态，仅当 shape 为 circle 相关值时有效
  },
  friendLink: {
    enabled: true, // 是否启用友情链接卡片
    list: [
      {
        name: "STCN 论坛讨论帖",
        desc: "在 STCN 论坛与诸多志同道合的同学讨论 OMI。",
        avatar: "https://forum.smart-teach.cn/assets/favicon-v4ksoaxf.png",
        link: "http://forum.smart-teach.cn/d/1783",
      },
    ], // 友情链接数据列表
  },
  docAnalysis: {
    enabled: true, // 是否启用站点信息卡片
    createTime: "2026-05-11", // 站点创建时间
    wordCount: true, // 是否开启文章页的字数统计
    readingTime: true, // 是否开启文章页的阅读时长统计
  },
  social: [
    {
      icon: "mdi:github",
      name: "GitHub",
      link: "https://github.com/MacroMeng/OhMyIWB",
    },
  ], 
  footerInfo: {
    // 页脚信息，支持 HTML 格式（位于主题版权上方）
    topMessage: ["OhMyIWB Project"],
    // 页脚信息，支持 HTML 格式（位于主题版权下方）
    bottomMessage: ["智在知互 · 思于识通"],
    // 主题版权配置
    theme: {
      show: true,
    },
    // 博客版权配置
    copyright: {
      show: true, // 是否显示博客版权
      createYear: 2026, // 创建年份
      suffix: "OhMyIWB Project", // 后缀
    },
  },
  // 文章页底部的最近更新栏配置
  articleUpdate: {
    enabled: true, // 是否启用文章最近更新栏
    limit: 3, // 文章最近更新栏显示数量
  },
});

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "OhMyIWB",
  description: "OhMyIWB · 智在知互 思于识通",
  extends: teekConfig,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Daily', link: '/daily/' },
      { text: 'Thinklog', link: '/thinklog/'}
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/MacroMeng/OhMyIWB' }
    ]
  },
  srcDir: 'posts',
  markdown: {
    math: true
  }
})
