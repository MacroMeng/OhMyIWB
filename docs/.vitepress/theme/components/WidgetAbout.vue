<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
const about = computed(() => theme.value.kratos?.about || {})
</script>

<template>
  <div class="widget widget-about">
    <div class="avatar-wrap">
      <img class="avatar" :src="about.avatar" :alt="about.name" />
    </div>
    <div class="name">{{ about.name }}</div>
    <p class="describe">{{ about.describe }}</p>
    <div class="social">
      <a
        v-for="item in about.social"
        :key="item.icon"
        class="social-link"
        :href="item.url"
        :title="item.label"
        target="_blank"
        rel="nofollow"
      >
        <KIcon :name="item.icon" />
      </a>
    </div>
  </div>
</template>
