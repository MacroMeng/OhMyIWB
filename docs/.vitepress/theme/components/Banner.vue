<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
const banner = computed(() => theme.value.kratos?.banner || {})
</script>

<template>
  <div class="banner">
    <div class="overlay"></div>
    <div
      class="content"
      :style="{ backgroundImage: `url(${banner.image})` }"
    >
      <div class="introduce">
        <div class="title">{{ banner.title }}</div>
        <div class="mate">{{ banner.describe }}</div>
      </div>
    </div>
  </div>
</template>
