<script setup>
import '@/components/WebProjects/css/web.css';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import {onMounted, onUnmounted, ref} from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import {Swiper, SwiperSlide} from 'swiper/vue';
import {EffectCoverflow, Keyboard, Mousewheel, Navigation, Pagination} from "swiper/modules";
import VideoOrGif from "./VideoOrGif.vue";
import PreviewIcon from "@/assets/icons/PreviewIcon.vue";

import GithubIcon from "@/components/Header/icons/github.vue"
import slides from './slides.js'
import {runWebAnimations} from "@/components/WebProjects/animations/sectionWebAnimations.js";

const swiperRef = ref(null);
const activeSlideIndex = ref(1);
const expandedSlideIndex = ref(null);
const modules = [Navigation, EffectCoverflow, Keyboard, Mousewheel, Pagination]
let animationContext

function getRef(swiperInstance) {
  swiperRef.value = swiperInstance
  activeSlideIndex.value = swiperInstance.activeIndex
}

function handleSlideChange(swiperInstance) {
  activeSlideIndex.value = swiperInstance.activeIndex

  if (expandedSlideIndex.value !== swiperInstance.activeIndex) {
    expandedSlideIndex.value = null
  }
}

function handleCardClick(index) {
  const swiperInstance = swiperRef.value

  if (!swiperInstance || !swiperInstance.allowClick) {
    return
  }

  if (swiperInstance.activeIndex !== index) {
    expandedSlideIndex.value = null
    swiperInstance.slideTo(index)
    return
  }

  expandedSlideIndex.value = expandedSlideIndex.value === index ? null : index
}

function closeExpandedCard() {
  expandedSlideIndex.value = null
}

gsap.registerPlugin(ScrollTrigger)
onMounted(() => {
  animationContext = gsap.context(() => {
    runWebAnimations()
  })
})

onUnmounted(() => animationContext?.revert())

</script>
<template>
  <section id="web-projects">
    <h2 class="title">Web Development</h2>
    <Swiper
        id="swiper-parent"
        @swiper="getRef"
        @slideChange="handleSlideChange"
        :modules="modules"
        effect="coverflow"
        :grabCursor="true"
        :centeredSlides="true"
        :initial-slide="1"
        :spaceBetween="18"
        :coverflowEffect="{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 3,
          slideShadows: true
        }"
        :keyboard="{ enabled: true }"
        :loop="false"
        :rewind="true"
        :pagination="{ el: '.swiper-pagination', clickable: true }"
        :breakpoints="{
          640: { slidesPerView: 2 },
          768: { slidesPerView: 2 },
          800: { slidesPerView: 3 },
          1024: { slidesPerView: 3 },
          1560: { slidesPerView: 3 }
        }">
      <SwiperSlide
          v-for="(slide, index) in slides"
          :id="'slide-id-' + index"
          :key="slide.title"
          :class="{'is-card-expanded': expandedSlideIndex === index}">
        <article
            class="project-card"
            :class="{
              'is-active-card': activeSlideIndex === index,
              'is-expanded': expandedSlideIndex === index
            }"
            tabindex="0"
            :aria-expanded="expandedSlideIndex === index"
            :aria-label="`${slide.title} project card. Click to select, then click again to expand.`"
            @click="handleCardClick(index)"
            @keydown.enter.self.prevent="handleCardClick(index)"
            @keydown.space.self.prevent="handleCardClick(index)">
          <!-- <button
              v-if="expandedSlideIndex === index"
              class="project-card-close"
              type="button"
              :aria-label="`Close expanded ${slide.title} card`"
              @click.stop="closeExpandedCard">
            <span aria-hidden="true">×</span>
          </button> -->
          <div class="project-media">
            <VideoOrGif :video="slide.video" :gif="slide.gif" :title="slide.title"/>
          </div>
          <div class="project-details">
            <div class="project-copy">
              <h3>{{ slide.title }}</h3>
              <p>{{ slide.description }}</p>
            </div>
            <div class="project-actions" @click.stop>
              <a v-if="slide.githubLink" :href="slide.githubLink" target="_blank" rel="noopener noreferrer" :aria-label="`${slide.title} source code on GitHub`">
                <GithubIcon/>
                Github
              </a>
              <a v-if="slide.previewLink" :href="slide.previewLink" target="_blank" rel="noopener noreferrer" :aria-label="`Open ${slide.title} preview`">
                <PreviewIcon/>
                Preview
              </a>
            </div>
          </div>
        </article>
      </SwiperSlide>
      <div class="swiper-pagination"></div>
    </Swiper>
  </section>
</template>
