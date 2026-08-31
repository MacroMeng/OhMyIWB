<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
const footer = computed(() => theme.value.kratos?.footer || {})
const about = computed(() => theme.value.kratos?.about || {})
</script>

<template>
  <footer class="k-footer">
    <div class="container">
      <div class="row">
        <div class="col-12 text-center">
          <p v-if="about.social?.length" class="social">
            <a
              v-for="item in about.social"
              :key="item.icon"
              class="social-icon"
              :href="item.url"
              :title="item.label"
              target="_blank"
              rel="nofollow"
            >
              <KIcon :name="item.icon" />
            </a>
          </p>
          <p class="copyright">{{ footer.copyright }}</p>
          <p class="theme-info">
            Theme <a href="https://github.com/seatonjiang/kratos" target="_blank" rel="nofollow">Kratos</a> Made By
            <a href="https://seatonjiang.com" target="_blank" rel="nofollow">Seaton Jiang</a>
          </p>
          <p v-if="footer.icp" class="icp">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="nofollow">{{ footer.icp }}</a>
          </p>
          <p v-if="footer.gov" class="gov">{{ footer.gov }}</p>
        </div>
      </div>
    </div>
  </footer>
</template>
