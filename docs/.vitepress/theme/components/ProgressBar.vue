<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const progress = ref(0)

function update() {
  const doc = document.documentElement
  const total = doc.scrollHeight - doc.clientHeight
  progress.value = total > 0 ? (doc.scrollTop / total) * 100 : 0
}

onMounted(() => {
  update()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', update)
  window.removeEventListener('resize', update)
})
</script>

<template>
  <div class="reading-progress" aria-hidden="true">
    <div class="reading-progress-bar" :style="{ width: progress + '%' }"></div>
  </div>
</template>
