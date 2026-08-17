<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import {portfolioAnchorsList} from "@/store/global.js";

gsap.registerPlugin(ScrollTrigger);

const slideUniqueId = 'portfolio-slide-' + Math.random().toString(36).substring(2, 7);
const props = defineProps({
  images: Array,
  description: String,
  maxHeight: {
    type: String,
    default: '80vh',
  },
});

let animationContext
const slideElement = ref(null)
const formattedDescription = computed(() =>
  (props.description || '').replace(/<br\s*\/?>/gi, '\n')
)

onMounted(() => {
  portfolioAnchorsList.value.push("#" + slideUniqueId)

  animationContext = gsap.context(() => {
    const tl = gsap.timeline();
    const slide = slideElement.value;
    const slidesContainer = slide?.closest('.portfolio-slides-container');
    const media = gsap.matchMedia();

    if (!slide || !slidesContainer) return

    media.add({
      isDesktop: `(min-width: 800px)`,
      isMobile: `(max-width: 799px)`,
    }, (context) => {
      const {isMobile} = context.conditions
      const slides = document.getElementsByClassName('portfolio-slide')
      const isLastSlide = slides[slides.length - 1] === slide
      const currentSlides = slidesContainer.getElementsByClassName('portfolio-slide')
      const isLastCoverSlide = currentSlides[currentSlides.length - 1].id === slide.id
      const end = isLastCoverSlide ? '65% 0%' : '100% 30%'

      tl.fromTo(slide, {opacity: 0, x: 100}, {
        scrollTrigger: {
          trigger: slide,
          start: 'top top',
          end: isMobile ? '100% 30%' : end,
          pinSpacing: isMobile || isLastSlide,
          scrub: 1,
          pin: true,
        },
        x: 0,
        opacity: 1,
      }, ">").to(slide, {opacity: 0, right: -100}, '>');
    });
  })
});

onUnmounted(() => {
  animationContext?.revert()
  const index = portfolioAnchorsList.value.indexOf("#" + slideUniqueId)
  if (index >= 0) portfolioAnchorsList.value.splice(index, 1)
})
</script>

<template>
  <div ref="slideElement" class="portfolio-slide" :id="slideUniqueId" data-portfolio-slide-snap>
    <div class="portfolio-slide__images">
      <img v-for="(image, index) in props.images" :key="index" :src="image" :alt="`Case study screenshot ${index + 1}`"/>
    </div>
    <div class="portfolio-slide__description">
      <div class="container">
        <p>{{ formattedDescription }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portfolio-slide {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  height: 80vh;
  min-width: 100%;
  min-height: 100%;
  opacity: 1;
  overflow-x: hidden;
  width: 100vw;
  box-sizing: border-box;
  background: black
}

.portfolio-slide__description {
  color: white;
  overflow-x: hidden;
  line-height: 1.4;
  white-space: pre-line;
  width: min(88vw, 720px);
}

.portfolio-slide__description .container {
  margin: 0;
  max-width: none;
  padding: 0;
}

@media (min-width: 768px) {
  .portfolio-slide {
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: clamp(32px, 4vw, 80px);
    padding-inline: clamp(24px, 4vw, 72px);
  }

  .portfolio-slide__images {
    display: flex;
    flex: 0 1 auto;
    justify-content: center;
  }

  .portfolio-slide__images img {
    max-width: 35vw;
    max-height: v-bind(maxHeight);
  }

  .portfolio-slide__description {
    flex: 0 1 clamp(320px, 32vw, 720px);
    width: clamp(320px, 32vw, 720px);
    max-width: 100%;
  }

  *, *::before, *::after {
    margin: 0;
  }
}

@media (max-width: 1290px) {
  .portfolio-slide__description {
    font-size: 14px;
  }

  .portfolio-slide__images img {
    max-height: 50vh;
  }
}

.portfolio-slide > .portfolio-slide__images,
.portfolio-slide > .portfolio-slide__description {
  opacity: 1;
  transition: opacity 80ms linear;
  will-change: opacity;
}

.portfolio-slide--swiping-down > .portfolio-slide__images,
.portfolio-slide--swiping-down > .portfolio-slide__description {
  opacity: .35;
}

img {
  height: initial !important;
  max-width: 80vw;
  overflow-x: hidden;
}
</style>
