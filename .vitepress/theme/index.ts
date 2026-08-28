// .vitepress/theme/index.ts
import Teek from "vitepress-theme-teek";
import "vitepress-theme-teek/index.css";
import './mmfonts.css'
import './waterfall.css'
import PostCardList from "./components/PostCardList.vue";

export default {
  extends: Teek,
  enhanceApp({ app }) {
    app.component("PostCardList", PostCardList);
  },
};
