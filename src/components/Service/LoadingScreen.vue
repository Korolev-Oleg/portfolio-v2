<script setup>
import {onMounted, onUnmounted, watch} from 'vue';
import {loader} from "@/store/global.js";
import {lockScroll, unlockScroll} from "@/components/Content/services.js";


onMounted(() => {
  lockScroll()
})

watch(() => loader.isLoading, (isLoading) => {
  if (!isLoading) {
    unlockScroll()
  }
})

onUnmounted(unlockScroll)

</script>

<template>
  <div v-if="loader.isLoading" class="loading-screen" id="loading-section" role="status" aria-live="polite">
    <p>Loading...
      <span>{{ loader.progress }}</span>%
    </p>
  </div>
</template>

<style>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-background);
  z-index: 9999;
}
</style>
