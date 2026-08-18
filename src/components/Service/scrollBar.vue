<script setup>
import {onMounted, onUnmounted, ref} from "vue";
import ChevronDownIcon from "@/components/Service/ChevronDownIcon.vue";
import gsap from "gsap";

const progress = ref(0)
const sections = ['about', 'web-projects', 'portfolio', 'contact']

const updateProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  progress.value = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 0
}

const nextAnchor = () => {
  const next = sections
    .map((id) => document.getElementById(id))
    .find((section) => section && section.getBoundingClientRect().top > 80)

  if (next) {
    next.scrollIntoView({behavior: 'smooth'})
  } else {
    window.scrollTo({top: 0, behavior: 'smooth'})
  }
}

onMounted(() => {
  updateProgress()
  window.addEventListener('scroll', updateProgress, {passive: true});
  // gsap.to('#scroll-down', {
  //   duration: .8,
  //   y: -10,
  //   repeat: -1,
  //   yoyo: true,
  //   ease: "power1.inOut",
  // });
});

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
  gsap.killTweensOf('#scroll-down')
})
</script>

<template>
  <!-- <button id="scroll-down" type="button" @click="nextAnchor" :aria-label="progress === 100 ? 'Back to top' : `Scroll to next section, ${progress}% read`">
    <ChevronDownIcon/>
    <span>{{ progress }}</span>%
  </button> -->
</template>

<style scoped>
#scroll-down {
  height: 10px;
  position: fixed;
  z-index: 200;
  bottom: 25px;
  width: 100%;
  text-align: center;
  cursor: pointer;
  border: 0;
  background: transparent;
  color: var(--color-text);
  padding: 0;
}

#scroll-down svg {
  display: block;
  margin: 0 auto;
}

</style>
