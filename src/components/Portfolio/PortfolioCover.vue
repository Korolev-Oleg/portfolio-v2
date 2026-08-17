<script setup>
import {onMounted, onUnmounted} from 'vue';
import gsap from 'gsap';
import {generateID} from '@/utils.js';
import ScrollTrigger from "gsap/ScrollTrigger";
import TextPlugin from "gsap/TextPlugin";

const titleId = generateID('cover-title')
const coverUniqueID = generateID('cover')
const coverIconUniqueID = generateID('cover-icon')
const slidesUniqueID = generateID('slides')
const timeLineUniqueID = generateID('timeline')

gsap.registerPlugin(ScrollTrigger, TextPlugin)

const props = defineProps({
  Icon: Object,
  title: String,
  autoTitle: Boolean,
})

let animationContext

onMounted(() => {
  animationContext = gsap.context(() => {
    const tl = gsap.timeline()

    tl.to('#' + coverUniqueID, {
      scrollTrigger: {
        trigger: '#' + coverUniqueID,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      }
    })
      .to('#' + coverIconUniqueID, {
        scrollTrigger: {
          trigger: '#' + coverUniqueID,
          start: 'top 10%',
          end: 'top bottom',
          scrub: 1,
          anticipatePin: 1,
          onEnter: () => {
            document.getElementById(timeLineUniqueID).style.display = 'block'
            document.getElementById(coverUniqueID).classList.add('cover-fixed')
          },
          onLeaveBack: () => {
            document.getElementById(timeLineUniqueID).style.display = 'none'
            document.getElementById(coverUniqueID).classList.remove('cover-fixed')
          },
        },
        scale: 1,
        opacity: 1,
      })

    if (props.autoTitle) {
      const titleAnimation = gsap.to(`#${titleId}`, {
        text: props.title,
        duration: 1,
        ease: 'power1.inOut',
        paused: true,
      })

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        titleAnimation.progress(1)
      } else {
        ScrollTrigger.create({
          trigger: '#' + coverUniqueID,
          start: 'center center',
          once: true,
          onEnter: () => titleAnimation.play(),
        })
      }
    } else {
      tl.to(`#${titleId}`, {
        scrollTrigger: {
          trigger: '#' + coverUniqueID,
          start: 'top 0',
          end: '1px',
          scrub: 2,
        },
        text: props.title,
        duration: .1,
      }, '<')
    }

    const cover = document.getElementById(coverUniqueID)
    const coverBg = cover.getElementsByClassName('cover-bg')[0]
    const fixCoverBGX = () => {
      coverBg.style.transform = `translateX(${coverBg.offsetLeft * -1}px)`
    }

    tl.to('#' + coverUniqueID, {
      minHeight: '100px',
      height: '100px',
      width: '100vw',
      scrollTrigger: {
        trigger: '#' + coverUniqueID,
        start: '1100px 90%',
        scrub: 1,
        onLeave: fixCoverBGX,
        onUpdate: fixCoverBGX,
      }
    }, '<')

    tl.to('.portfolio-slide', {
      scrollTrigger: {
        trigger: '#' + coverUniqueID,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
      stagger: 1,
    }, '<')

    tl.to('#' + coverUniqueID, {
      scrollTrigger: {
        trigger: '.portfolio-slide',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: fixCoverBGX,
      },
    })

    tl.to('#' + coverUniqueID, {
      scrollTrigger: {
        trigger: '#' + slidesUniqueID,
        start: 'bottom 25%',
        end: 'bottom 25%',
        scrub: 1,
      },
      opacity: 0,
    })
  })
})

onUnmounted(() => animationContext?.revert())
</script>

<template>
  <div class="portfolio-snap-anchor" data-portfolio-cover-snap aria-hidden="true"></div>
  <div class="cover" :id="coverUniqueID">
    <component :is="Icon" class="cover-icon" :id="coverIconUniqueID" aria-hidden="true"/>
    <h3 class="cover-title" :id="titleId"></h3>
    <div class="cover-bg"></div>
  </div>
  <div class="timeline" :id="timeLineUniqueID"></div>
  <div class="portfolio-slides-container" :id="slidesUniqueID">
    <slot/>
  </div>
</template>

<style scoped>
.portfolio-snap-anchor {
  height: 0;
  width: 100%;
}

.timeline {
  display: none;
  min-height: 100vh;
}

.cover.cover-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  width: 100vw !important;
  transform: none !important;
}

.cover-icon {
  height: 60px;
  width: 60px;
  scale: 0;
  opacity: 0;
  position: relative;
  z-index: 1;
}

.cover {
  position: relative;
  min-height: 102vh;
  display: flex;
  align-items: center;
  gap: 15px;
  justify-content: center;
  height: 70vh;
}

.cover-bg {
  overflow-x: hidden;
  inset: 0;
  width: 100%;
  height: 100%;
  background: black;
  position: absolute;
  z-index: 0;
}

.cover-title {
  color: #fff;
  font-size: 17px;
  font-weight: bold;
  position: relative;
  z-index: 1;
}

.active {
  color: red !important
}
</style>
