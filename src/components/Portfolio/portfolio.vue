<script setup>
import PortfolioCover from "@/components/Portfolio/PortfolioCover.vue";
import TitanControlIcon from "@/components/Portfolio/icons/titanControlIcon.vue";
import ProdlogisticaIcon from "@/components/Portfolio/icons/prodlogisticaIcon.vue";
import TendManagerIcon from "@/components/Portfolio/icons/TendManagerIcon.vue";
import PortfolioSlide from "@/components/Portfolio/PortfolioSlide.vue";

import TitanControlSlide1 from "./asserts/TitanControlSlide1.png";
import TitanControlSlide2 from "./asserts/TitanControlSlide2.png";
import TitanControlSlide3 from "./asserts/TitanControlSlide3.png";

import ProdlogisticaSlide1 from "./asserts/ProdlogisticaSlide1.png";
import ProdlogisticaSlide2 from "./asserts/ProdlogisticaSlide2.png";
import ProdlogisticaSlide3 from "./asserts/ProdlogisticaSlide3.png";
import ProdlogisticaSlide4 from "./asserts/ProdlogisticaSlide4.png";

import TendManager1 from "./asserts/TendManager1.png";
import TendManager2 from "./asserts/TendManager2.png";
import TendManager3 from "./asserts/TendManager3.png";
import TendManager4 from "./asserts/TendManager4.png";

import {onMounted, onUnmounted} from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import translations from "@/translations/portfolioTranslations.json";
import {initTranslations} from "@/utils.js";

const _ = initTranslations(translations);

gsap.registerPlugin(ScrollTrigger);
const PORTFOLIO_ENTRY_THRESHOLD = 0
const MIN_SNAP_GESTURE_PX = 1
const TRACKPAD_RELEASE_DELAY = 32
const AUTO_SCROLL_SPEED_MULTIPLIER = 1.35
const POST_SNAP_GUARD_MS = 32
const NEW_WHEEL_GESTURE_DELTA = 4
const NEW_WHEEL_GESTURE_RATIO = 1.35
let animationContext
let snapSetupFrame
let wheelReleaseTimer
let usesNativeScrollEnd = false
let lastObservedScroll = 0
let scrollDirection = 1
let snapTween
let isAutoScrolling = false
let suppressSnapUntil = 0
let autoScrollDirection = 0
let autoScrollTarget = null
let lastAutoRedirectAt = 0
let lastWheelDelta = 0
let lastWheelEventAt = 0
let touchStartY = null
let fadedPortfolioSlide = null

const getDocumentTop = (element) => element.getBoundingClientRect().top + window.scrollY

const getPortfolioSnapPoints = () => {
  const portfolio = document.getElementById('portfolio')
  if (!portfolio) return []

  const scrollTriggers = ScrollTrigger.getAll()
  const isMobile = window.innerWidth < 800
  const coverPoints = [...portfolio.querySelectorAll('[data-portfolio-cover-snap]')]
    .map((anchor) => {
      const cover = anchor.nextElementSibling
      const coverTrigger = scrollTriggers.find((trigger) =>
        trigger.trigger === cover && trigger.vars.start === 'top top'
      )

      return coverTrigger?.start ?? getDocumentTop(anchor)
    })
  const slidePoints = [...portfolio.querySelectorAll('[data-portfolio-slide-snap]')]
    .map((slide) => {
      const pinTrigger = scrollTriggers.find((trigger) =>
        trigger.trigger === slide && trigger.vars.pin
      )

      if (pinTrigger) return pinTrigger.end - 2

      const pinSpacer = slide.closest('.pin-spacer')
      const groupSlides = [...slide.closest('.portfolio-slides-container')
        .querySelectorAll('[data-portfolio-slide-snap]')]
      const isLastGroupSlide = groupSlides[groupSlides.length - 1] === slide
      const slideTop = getDocumentTop(pinSpacer || slide)
      const slideHeight = slide.getBoundingClientRect().height

      // Stop just before the reveal trigger releases its pin. At this point
      // the frame is aligned, fully opaque, and still fills the viewport.
      if (!isMobile && isLastGroupSlide) {
        return slideTop + slideHeight * 0.65 - 2
      }

      return slideTop + slideHeight - window.innerHeight * 0.3 - 2
    })

  return [...new Set([...coverPoints, ...slidePoints].map((point) => Math.max(0, Math.round(point))))]
    .sort((a, b) => a - b)
}

const updateScrollDirection = () => {
  const currentScroll = window.scrollY

  if (Math.abs(currentScroll - lastObservedScroll) > 1) {
    scrollDirection = currentScroll > lastObservedScroll ? 1 : -1
  }

  lastObservedScroll = currentScroll
}

const clearPortfolioSlideFade = () => {
  fadedPortfolioSlide?.classList.remove('portfolio-slide--swiping-down')
  fadedPortfolioSlide = null
}

const getCurrentPortfolioSlide = () => {
  const slides = [...document.querySelectorAll('#portfolio [data-portfolio-slide-snap]')]
  const viewportCenter = window.innerHeight / 2

  return slides
    .map((slide) => {
      const rect = slide.getBoundingClientRect()
      const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
      const opacity = Number.parseFloat(getComputedStyle(slide).opacity) || 0
      const centerDistance = Math.abs(rect.top + rect.height / 2 - viewportCenter)

      return {slide, score: visibleHeight * opacity - centerDistance * 0.001}
    })
    .filter(({score}) => score > 0)
    .sort((a, b) => b.score - a.score)[0]?.slide ?? null
}

const fadeCurrentPortfolioSlide = () => {
  const currentSlide = getCurrentPortfolioSlide()
  if (!currentSlide || currentSlide === fadedPortfolioSlide) return

  clearPortfolioSlideFade()
  fadedPortfolioSlide = currentSlide
  fadedPortfolioSlide.classList.add('portfolio-slide--swiping-down')
}

const updatePortfolioSlideFade = (delta) => {
  if (delta > 0) {
    fadeCurrentPortfolioSlide()
  } else if (delta < 0) {
    clearPortfolioSlideFade()
  }
}

const cancelAutoScroll = () => {
  if (isAutoScrolling) {
    snapTween?.kill()
    snapTween = null
    isAutoScrolling = false
    autoScrollDirection = 0
    autoScrollTarget = null
  }

  suppressSnapUntil = 0
  lastObservedScroll = window.scrollY
}

const normalizeWheelDelta = (event) => {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight

  return event.deltaY
}

const isNewWheelGesture = (delta, now) => {
  const direction = Math.sign(delta)
  const magnitude = Math.abs(delta)
  const directionChanged = direction && direction !== autoScrollDirection
  const separatedFromPreviousBurst = now - lastWheelEventAt > TRACKPAD_RELEASE_DELAY
  const magnitudeIncreased = magnitude >= Math.max(
    NEW_WHEEL_GESTURE_DELTA,
    lastWheelDelta * NEW_WHEEL_GESTURE_RATIO,
  )
  const redirectGuardActive = now - lastAutoRedirectAt < 90

  if (redirectGuardActive && !directionChanged) return false

  return directionChanged
    || (separatedFromPreviousBurst && magnitudeIncreased)
    || now - lastWheelEventAt > 120
}

const getDirectionalSnapTarget = (origin, direction) => {
  const snapPoints = getPortfolioSnapPoints()
  if (!snapPoints.length) return null

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  const targets = [...new Set([...snapPoints, maxScroll])].sort((a, b) => a - b)

  if (direction > 0) {
    return targets.find((point) => point > origin + MIN_SNAP_GESTURE_PX) ?? null
  }

  return [...targets].reverse()
    .find((point) => point < origin - MIN_SNAP_GESTURE_PX) ?? null
}

const redirectAutoScroll = (delta, now) => {
  const direction = Math.sign(delta) || autoScrollDirection
  const origin = autoScrollTarget ?? window.scrollY
  const target = getDirectionalSnapTarget(origin, direction)

  if (target === null) {
    cancelAutoScroll()
    return
  }

  lastAutoRedirectAt = now
  scrollToSnapTarget(target)
}

const settleAfterTrackpadRelease = (event) => {
  const now = performance.now()
  const delta = normalizeWheelDelta(event)

  if (isAutoScrolling) {
    if (!isNewWheelGesture(delta, now)) {
      if (event.cancelable) event.preventDefault()
      lastWheelDelta = Math.abs(delta)
      lastWheelEventAt = now
      return
    }

    if (event.cancelable) event.preventDefault()
    updatePortfolioSlideFade(delta)
    lastWheelDelta = Math.abs(delta)
    lastWheelEventAt = now
    redirectAutoScroll(delta, now)
    return
  }

  suppressSnapUntil = 0
  updatePortfolioSlideFade(delta)
  if (Math.abs(delta) >= MIN_SNAP_GESTURE_PX) {
    scrollDirection = Math.sign(delta)
  }
  lastWheelDelta = Math.abs(delta)
  lastWheelEventAt = now
  window.clearTimeout(wheelReleaseTimer)
  wheelReleaseTimer = window.setTimeout(() => {
    wheelReleaseTimer = null
    settlePortfolioFrame()
    if (!isAutoScrolling) clearPortfolioSlideFade()
  }, TRACKPAD_RELEASE_DELAY)
}

const handleTouchStart = (event) => {
  cancelAutoScroll()
  clearPortfolioSlideFade()
  touchStartY = event.touches[0]?.clientY ?? null
}

const handleTouchMove = (event) => {
  const currentTouchY = event.touches[0]?.clientY
  if (touchStartY === null || currentTouchY === undefined) return

  updatePortfolioSlideFade(touchStartY - currentTouchY)
}

const settleAfterTouchRelease = () => {
  touchStartY = null
  window.clearTimeout(wheelReleaseTimer)
  wheelReleaseTimer = null
  window.requestAnimationFrame(() => {
    settlePortfolioFrame()
    if (!isAutoScrolling) clearPortfolioSlideFade()
  })
}

const scrollToSnapTarget = (target) => {
  const distance = Math.abs(target - window.scrollY)
  if (distance < MIN_SNAP_GESTURE_PX) return

  updatePortfolioSlideFade(target - window.scrollY)

  snapTween?.kill()
  isAutoScrolling = true
  autoScrollDirection = Math.sign(target - window.scrollY)
  autoScrollTarget = target

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({top: target, behavior: 'auto'})
    isAutoScrolling = false
    autoScrollDirection = 0
    autoScrollTarget = null
    suppressSnapUntil = performance.now() + POST_SNAP_GUARD_MS
    lastObservedScroll = window.scrollY
    clearPortfolioSlideFade()
    return
  }

  const scrollState = {top: window.scrollY}
  snapTween = gsap.to(scrollState, {
    top: target,
    duration: gsap.utils.clamp(
      0.12 / AUTO_SCROLL_SPEED_MULTIPLIER,
      0.32 / AUTO_SCROLL_SPEED_MULTIPLIER,
      distance / (3600 * AUTO_SCROLL_SPEED_MULTIPLIER),
    ),
    ease: 'power3.out',
    overwrite: true,
    onUpdate: () => window.scrollTo(0, scrollState.top),
    onComplete: () => {
      snapTween = null
      isAutoScrolling = false
      autoScrollDirection = 0
      autoScrollTarget = null
      suppressSnapUntil = performance.now() + POST_SNAP_GUARD_MS
      lastObservedScroll = window.scrollY
      clearPortfolioSlideFade()
    },
  })
}

const settlePortfolioFrame = () => {
  if (isAutoScrolling || performance.now() < suppressSnapUntil) return

  const snapPoints = getPortfolioSnapPoints()
  if (!snapPoints.length) return

  const currentScroll = window.scrollY
  const firstPoint = snapPoints[0]
  const lastPoint = snapPoints[snapPoints.length - 1]
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  const entryBoundary = window.innerHeight * PORTFOLIO_ENTRY_THRESHOLD

  if (currentScroll < firstPoint) {
    if (scrollDirection < 0 || currentScroll < firstPoint - entryBoundary) return

    const entryProgress = (currentScroll - (firstPoint - entryBoundary)) / entryBoundary
    if (entryProgress < PORTFOLIO_ENTRY_THRESHOLD) return

    scrollToSnapTarget(firstPoint)
    return
  }

  if (currentScroll > lastPoint) {
    const target = scrollDirection > 0 ? maxScroll : lastPoint

    if (Math.abs(target - currentScroll) < MIN_SNAP_GESTURE_PX) return

    scrollToSnapTarget(target)
    return
  }

  if (snapPoints.some((point) => Math.abs(point - currentScroll) < MIN_SNAP_GESTURE_PX)) return

  const upperIndex = snapPoints.findIndex((point) => point > currentScroll)
  if (upperIndex <= 0) return

  const lowerPoint = snapPoints[upperIndex - 1]
  const upperPoint = snapPoints[upperIndex]
  const distanceFromGestureOrigin = scrollDirection > 0
    ? currentScroll - lowerPoint
    : upperPoint - currentScroll

  if (distanceFromGestureOrigin < MIN_SNAP_GESTURE_PX) return

  scrollToSnapTarget(scrollDirection > 0 ? upperPoint : lowerPoint)
}

const settleAfterNativeScrollEnd = () => {
  if (performance.now() - lastWheelEventAt <= TRACKPAD_RELEASE_DELAY) return

  settlePortfolioFrame()
  if (!isAutoScrolling) clearPortfolioSlideFade()
}

onMounted(() => {
  lastObservedScroll = window.scrollY
  window.addEventListener('scroll', updateScrollDirection, {passive: true})
  window.addEventListener('wheel', settleAfterTrackpadRelease, {passive: false})
  window.addEventListener('touchstart', handleTouchStart, {passive: true})
  window.addEventListener('touchmove', handleTouchMove, {passive: true})
  window.addEventListener('touchend', settleAfterTouchRelease, {passive: true})

  animationContext = gsap.context(() => {
    const tl = gsap.timeline();

    tl.to('.head', {
      scrollTrigger: {
        trigger: '#portfolio',
        start: 'top 30%',
        end: 'top 0%',
        scrub: 1,
      },
      y: "-50vw",
    });

    const scrollTriggerRule = {
      trigger: '#portfolio',
      start: 'top 5%',
      end: 'top 5%',
      scrub: true,
    };
    tl.to(['body', '#app'], {
      scrollTrigger: scrollTriggerRule,
      backgroundColor: '#000',
    }).to(".head", {
      scrollTrigger: scrollTriggerRule,
      backgroundColor: '#000'
    }, '>');
  })

  snapSetupFrame = window.requestAnimationFrame(() => {
    ScrollTrigger.refresh()
    usesNativeScrollEnd = 'onscrollend' in window

    if (usesNativeScrollEnd) {
      window.addEventListener('scrollend', settleAfterNativeScrollEnd, {passive: true})
    } else {
      ScrollTrigger.addEventListener('scrollEnd', settlePortfolioFrame)
    }
  })
});

onUnmounted(() => {
  window.cancelAnimationFrame(snapSetupFrame)
  window.clearTimeout(wheelReleaseTimer)
  cancelAutoScroll()
  clearPortfolioSlideFade()
  window.removeEventListener('scroll', updateScrollDirection)
  window.removeEventListener('wheel', settleAfterTrackpadRelease)
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', settleAfterTouchRelease)

  if (usesNativeScrollEnd) {
    window.removeEventListener('scrollend', settleAfterNativeScrollEnd)
  } else {
    ScrollTrigger.removeEventListener('scrollEnd', settlePortfolioFrame)
  }

  animationContext?.revert()
})
</script>

<template>
  <section id="portfolio">
    <PortfolioCover :Icon="TitanControlIcon" title="TitanControl" auto-title>
      <PortfolioSlide class="portfolio-slide" :images="[TitanControlSlide1]"
                      :description="_('titan-control-slide-1')"/>
      <PortfolioSlide class="portfolio-slide" :images="[TitanControlSlide2]"
                      :description="_('titan-control-slide-2')"/>
      <!-- <PortfolioSlide class="portfolio-slide" :images="[TitanControlSlide3]"
                      :description="_('titan-control-slide-3')"/> -->
    </PortfolioCover>
    <PortfolioCover :Icon="ProdlogisticaIcon" title="Prodlogistica">
      <PortfolioSlide class="portfolio-slide" :images="[ProdlogisticaSlide1]"
                      :description="_('prodlogistica-slide-1')"/>
      <PortfolioSlide class="portfolio-slide" :images="[ProdlogisticaSlide2]"
                      :description="_('prodlogistica-slide-2')"/>
      <PortfolioSlide class="portfolio-slide" :images="[ProdlogisticaSlide3]"
                      :description="_('prodlogistica-slide-3')"/>
      <PortfolioSlide class="portfolio-slide" :images="[ProdlogisticaSlide4]"
                      :description="_('prodlogistica-slide-4')"/>
    </PortfolioCover>
    <PortfolioCover :Icon="TendManagerIcon" title="TendManager">
      <PortfolioSlide class="portfolio-slide" :images="[TendManager1]"
                      maxHeight="639px"
                      :description="_('tend-manager-slide-1')"/>
      <PortfolioSlide class="portfolio-slide" :images="[TendManager3]"
                      :description="_('tend-manager-slide-3')"/>
      <PortfolioSlide class="portfolio-slide" :images="[TendManager2]"
                      :description="_('tend-manager-slide-2')"/>
      <PortfolioSlide class="portfolio-slide" :images="[TendManager4]"
                      :description="_('tend-manager-slide-4')"/>
    </PortfolioCover>

  </section>
</template>

<style scoped>
#portfolio {
  background: #000;
  border-radius: 44px 44px 0 0;
  overflow-x: hidden;
}

.portfolio-slides-container {
  overflow: hidden;
}
</style>
