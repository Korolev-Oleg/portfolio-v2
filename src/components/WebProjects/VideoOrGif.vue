<script setup>
import {onMounted, onUnmounted, ref} from 'vue'

defineProps({
  video: {
    type: String,
    required: true,
  },
  gif: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
})

const isMobile = ref(false)
let mediaQuery
const updateDevice = () => {
  isMobile.value = mediaQuery.matches
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 767px), (pointer: coarse)')
  updateDevice()
  mediaQuery.addEventListener('change', updateDevice)
})

onUnmounted(() => mediaQuery?.removeEventListener('change', updateDevice))
</script>
<template>
  <video v-if="!isMobile" autoplay muted loop playsinline preload="metadata" :aria-label="`${title} project preview`">
    <source :src="video" type="video/mp4">
    Your browser does not support the video tag.
  </video>
  <div v-else class="gif">
    <img :src="gif" :alt="`${title} project preview`">
  </div>
</template>
<style scoped>
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
