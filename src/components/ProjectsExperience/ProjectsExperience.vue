<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref} from 'vue'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import translationStore from '@/store/global.js'
import {syncLocale} from '@/utils.js'
import translations from '@/translations/projectsExperienceTranslations.json'
import {projects, storyStops, webProjectStopCount} from './projectsData.js'
import './projects-experience.css'

gsap.registerPlugin(ScrollTrigger)

const root = ref(null)
const stage = ref(null)
const canvas = ref(null)
const locale = ref('en')
const activeStopIndex = ref(0)
const isFallback = ref(false)
const isTouch = ref(false)
const isSwipingDown = ref(false)
const sectionVisible = ref(false)
const performanceMetrics = ref({fps: 0, frameTime: 0, dpr: 1, drawCalls: 0, textures: 0, webgl2: false})
const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
const perfEnabled = searchParams.has('perf')
const forcedFallback = import.meta.env.DEV && searchParams.has('fallback')
const testLocale = import.meta.env.DEV ? searchParams.get('lang') : null
const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const projectFirstStops = projects.map((project) => storyStops.findIndex((stop) => stop.project.id === project.id))
const projectAnchorTop = `calc(${webProjectStopCount} * 100svh)`

let sceneController
let storyTrigger
let resizeObserver
let intersectionObserver
let longPressTimer
let touchStart = null
let touchLensActive = false
let scrollTween
let wheelReleaseTimer
let touchScrollStartY = null
let scrollDirection = 1
let isAutoScrolling = false
let autoScrollDirection = 0
let autoScrollTarget = null
let lastWheelDelta = 0
let lastWheelEventAt = 0
let lastObservedScroll = 0
let usesNativeScrollEnd = false

const MIN_SNAP_GESTURE_PX = 1
const TRACKPAD_RELEASE_DELAY = 32
const AUTO_SCROLL_SPEED_MULTIPLIER = 1.35
const NEW_WHEEL_GESTURE_DELTA = 4
const NEW_WHEEL_GESTURE_RATIO = 1.35
const NEW_WHEEL_GESTURE_IDLE_DELAY = 90

const monotonicNow = () => window.performance?.now?.() ?? Date.now()

const copy = computed(() => translations[locale.value] || translations.en)
const t = (key) => copy.value[key] || translations.en[key] || key
const activeStop = computed(() => storyStops[activeStopIndex.value] || storyStops[0])
const activeProject = computed(() => activeStop.value.project)
const activeSlide = computed(() => activeStop.value.slide)
const activeProjectIndex = computed(() => activeStop.value.projectIndex)
const activeSlideIndex = computed(() => activeStop.value.slideIndex)
const terminalLines = computed(() => translations.en.terminal)
const storyStyle = computed(() => ({'--story-steps': storyStops.length}))
const activeAccent = computed(() => activeProject.value.accent)
const hasGithub = computed(() => Boolean(activeProject.value.links.github))
const hasPreview = computed(() => Boolean(activeProject.value.links.preview))
const progressPercent = computed(() => storyStops.length > 1
  ? (activeStopIndex.value / (storyStops.length - 1)) * 100
  : 0)

const normalizedText = (key) => t(key).replace(/<br\s*\/?>/gi, '\n')

const scrollPositionForStop = (stopIndex) => {
  if (!root.value) return window.scrollY
  const rootTop = root.value.getBoundingClientRect().top + window.scrollY
  const scrollDistance = Math.max(root.value.offsetHeight - window.innerHeight, 0)
  const progress = stopIndex / Math.max(storyStops.length - 1, 1)
  return rootTop + scrollDistance * progress
}

const goToStop = (stopIndex, behavior = 'smooth') => {
  const nextIndex = Math.max(0, Math.min(storyStops.length - 1, stopIndex))
  const target = scrollPositionForStop(nextIndex)
  if (behavior === 'smooth' && !reducedMotion) scrollToSnapTarget(target)
  else window.scrollTo({top: target, behavior})
}

const goToProject = (projectIndex) => goToStop(projectFirstStops[projectIndex])

const onAboutProjectRequest = (event) => {
  const projectId = event.detail?.projectId
  const projectIndex = projects.findIndex((project) => project.id === projectId)
  if (projectIndex < 0) return

  if (isFallback.value) {
    document.getElementById('web-projects')?.scrollIntoView({behavior: reducedMotion ? 'auto' : 'smooth', block: 'start'})
    return
  }

  goToProject(projectIndex)
}

const stopPositions = () => storyStops.map((_, index) => scrollPositionForStop(index))

const cancelScrollTween = () => {
  scrollTween?.kill()
  scrollTween = null
  lastObservedScroll = window.scrollY
  isAutoScrolling = false
  autoScrollDirection = 0
  autoScrollTarget = null
  isSwipingDown.value = false
}

const scrollToSnapTarget = (target) => {
  const distance = Math.abs(target - window.scrollY)
  if (distance < MIN_SNAP_GESTURE_PX) return

  window.clearTimeout(wheelReleaseTimer)
  wheelReleaseTimer = null
  scrollTween?.kill()
  isAutoScrolling = true
  autoScrollDirection = Math.sign(target - window.scrollY)
  autoScrollTarget = target
  isSwipingDown.value = autoScrollDirection > 0

  const scrollState = {top: window.scrollY}
  scrollTween = gsap.to(scrollState, {
    top: target,
    duration: gsap.utils.clamp(
      0.12 / AUTO_SCROLL_SPEED_MULTIPLIER,
      0.32 / AUTO_SCROLL_SPEED_MULTIPLIER,
      distance / (3600 * AUTO_SCROLL_SPEED_MULTIPLIER),
    ),
    ease: 'power3.out',
    overwrite: true,
    onUpdate: () => {
      window.scrollTo(0, scrollState.top)
      // Treat tween-driven movement as authoritative. Comparing it with a
      // stale native-momentum position can look like a reverse gesture and
      // send the story back one frame before advancing again.
      lastObservedScroll = scrollState.top
    },
    onComplete: () => {
      lastObservedScroll = window.scrollY
      scrollTween = null
      isAutoScrolling = false
      autoScrollDirection = 0
      autoScrollTarget = null
      isSwipingDown.value = false
    },
  })
}

const directionalTarget = (origin, direction) => {
  const targets = stopPositions()
  if (!targets.length) return null
  if (direction > 0) return targets.find((point) => point > origin + 0.5) ?? null
  return [...targets].reverse().find((point) => point < origin - 0.5) ?? null
}

const settleStory = () => {
  if (!sectionVisible.value || isFallback.value || isAutoScrolling) return
  const rootTop = root.value?.getBoundingClientRect().top + window.scrollY
  const rootEnd = rootTop + Math.max((root.value?.offsetHeight || 0) - window.innerHeight, 0)
  if (window.scrollY < rootTop - 1 || window.scrollY > rootEnd + 1) return

  if (stopPositions().some((point) => Math.abs(point - window.scrollY) < 0.75)) return
  const target = directionalTarget(window.scrollY, scrollDirection)
  if (target !== null) scrollToSnapTarget(target)
}

const onStoryScroll = () => {
  const delta = window.scrollY - lastObservedScroll
  if (isAutoScrolling) {
    lastObservedScroll = window.scrollY
    return
  }

  if (Math.abs(delta) >= 0.5) {
    scrollDirection = Math.sign(delta)
    window.clearTimeout(wheelReleaseTimer)
    wheelReleaseTimer = window.setTimeout(settleStory, TRACKPAD_RELEASE_DELAY)
  }
  lastObservedScroll = window.scrollY
}

const onStoryScrollEnd = () => {
  if (monotonicNow() - lastWheelEventAt <= TRACKPAD_RELEASE_DELAY) return
  settleStory()
}

const normalizedWheelDelta = (event) => {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight
  return event.deltaY
}

const onStoryWheel = (event) => {
  if (!sectionVisible.value || isFallback.value) return
  const delta = normalizedWheelDelta(event)
  if (Math.abs(delta) < MIN_SNAP_GESTURE_PX) return
  const now = monotonicNow()
  const direction = Math.sign(delta)
  isSwipingDown.value = direction > 0

  if (isAutoScrolling) {
    const magnitude = Math.abs(delta)
    const strongerImpulse = magnitude >= Math.max(
      NEW_WHEEL_GESTURE_DELTA,
      lastWheelDelta * NEW_WHEEL_GESTURE_RATIO,
    )
    const resumedAfterPause = now - lastWheelEventAt > NEW_WHEEL_GESTURE_IDLE_DELAY
      && magnitude >= NEW_WHEEL_GESTURE_DELTA * 2
    const newGesture = direction !== autoScrollDirection || strongerImpulse || resumedAfterPause
    if (event.cancelable) event.preventDefault()
    if (newGesture) {
      const target = directionalTarget(autoScrollTarget ?? window.scrollY, direction)
      if (target === null) cancelScrollTween()
      else scrollToSnapTarget(target)
    }
    lastWheelDelta = Math.abs(delta)
    lastWheelEventAt = now
    return
  }

  scrollDirection = direction
  lastWheelDelta = Math.abs(delta)
  lastWheelEventAt = now
  window.clearTimeout(wheelReleaseTimer)
  wheelReleaseTimer = window.setTimeout(settleStory, TRACKPAD_RELEASE_DELAY)
}

const onStoryTouchStart = (event) => {
  cancelScrollTween()
  touchScrollStartY = event.touches[0]?.clientY ?? null
}

const onStoryTouchMove = (event) => {
  const y = event.touches[0]?.clientY
  if (touchScrollStartY === null || y === undefined) return
  const delta = touchScrollStartY - y
  if (Math.abs(delta) < MIN_SNAP_GESTURE_PX) return
  scrollDirection = Math.sign(delta)
  isSwipingDown.value = scrollDirection > 0
}

const onStoryTouchEnd = () => {
  touchScrollStartY = null
  window.clearTimeout(wheelReleaseTimer)
  wheelReleaseTimer = null
  window.requestAnimationFrame(settleStory)
}

const onKeydown = (event) => {
  if (!sectionVisible.value || isFallback.value) return
  const target = event.target
  if (target instanceof HTMLAnchorElement || target instanceof HTMLButtonElement) return

  const keys = ['ArrowDown', 'ArrowRight', 'PageDown', 'ArrowUp', 'ArrowLeft', 'PageUp', 'Home', 'End']
  if (!keys.includes(event.key)) return
  event.preventDefault()

  if (event.key === 'Home') goToStop(0)
  else if (event.key === 'End') goToStop(storyStops.length - 1)
  else if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(event.key)) goToStop(activeStopIndex.value + 1)
  else goToStop(activeStopIndex.value - 1)
}

const clearLongPress = () => {
  window.clearTimeout(longPressTimer)
  longPressTimer = null
}

const onPointerDown = (event) => {
  if (event.pointerType !== 'touch' || !sceneController) return
  clearLongPress()
  touchStart = {x: event.clientX, y: event.clientY, pointerId: event.pointerId}
  longPressTimer = window.setTimeout(() => {
    touchLensActive = sceneController.pointerMove(event.clientX, event.clientY, true)
    if (!touchLensActive) return
    canvas.value?.setPointerCapture?.(event.pointerId)
    sceneController.setLensActive(true)
  }, 360)
}

const onPointerMove = (event) => {
  if (!sceneController) return

  if (event.pointerType !== 'touch') {
    sceneController.pointerMove(event.clientX, event.clientY, true)
    return
  }

  if (!touchStart) return
  const distance = Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y)
  if (!touchLensActive && distance > 10) clearLongPress()
  if (!touchLensActive) return

  if (event.cancelable) event.preventDefault()
  sceneController.pointerMove(event.clientX, event.clientY, true)
}

const endTouchLens = (event) => {
  clearLongPress()
  if (touchLensActive) {
    sceneController?.setLensActive(false)
    if (touchStart && canvas.value?.hasPointerCapture?.(touchStart.pointerId)) {
      canvas.value.releasePointerCapture(touchStart.pointerId)
    }
  }
  touchLensActive = false
  touchStart = null
}

const onPointerLeave = (event) => {
  if (event.pointerType !== 'touch') sceneController?.setLensActive(false)
}

const setupStory = () => {
  if (!root.value || !stage.value) return

  storyTrigger = ScrollTrigger.create({
    trigger: root.value,
    start: 'top top',
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const stop = Math.round(self.progress * (storyStops.length - 1))
      activeStopIndex.value = Math.max(0, Math.min(storyStops.length - 1, stop))
      sceneController?.setProgress(self.progress)
    },
  })
}

const useFallbackPresentation = () => {
  isFallback.value = true
  sceneController?.destroy()
  sceneController = null
  storyTrigger?.kill()
  storyTrigger = null
}

onMounted(async () => {
  syncLocale(translationStore)
  const browserLocale = testLocale || navigator.language || navigator.userLanguage || 'en'
  locale.value = browserLocale.toLowerCase().startsWith('ru') ? 'ru' : 'en'
  document.documentElement.lang = locale.value
  isTouch.value = window.matchMedia('(pointer: coarse)').matches

  await nextTick()
  window.addEventListener('portfolio:go-to-project', onAboutProjectRequest)

  if (reducedMotion || forcedFallback) {
    useFallbackPresentation()
    return
  }

  const {createProjectScene} = await import('./webgl/createProjectScene.js')
  sceneController = createProjectScene({
    canvas: canvas.value,
    projects,
    stops: storyStops,
    onFailure: useFallbackPresentation,
    onPerformance: (metrics) => {
      performanceMetrics.value = metrics
    },
  })

  if (!sceneController) {
    useFallbackPresentation()
    return
  }

  resizeObserver = new ResizeObserver(([entry]) => {
    const {width, height} = entry.contentRect
    sceneController?.resize(width, height)
  })
  resizeObserver.observe(stage.value)

  intersectionObserver = new IntersectionObserver(([entry]) => {
    sectionVisible.value = entry.isIntersecting
    sceneController?.setVisible(entry.isIntersecting)
  }, {rootMargin: '20% 0px 20% 0px', threshold: 0.01})
  intersectionObserver.observe(root.value)

  setupStory()
  lastObservedScroll = window.scrollY
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onStoryScroll, {passive: true})
  window.addEventListener('wheel', onStoryWheel, {passive: false})
  window.addEventListener('touchstart', onStoryTouchStart, {passive: true})
  window.addEventListener('touchmove', onStoryTouchMove, {passive: true})
  window.addEventListener('touchend', onStoryTouchEnd, {passive: true})
  usesNativeScrollEnd = 'onscrollend' in window
  if (usesNativeScrollEnd) window.addEventListener('scrollend', onStoryScrollEnd, {passive: true})
  else ScrollTrigger.addEventListener('scrollEnd', onStoryScrollEnd)
  ScrollTrigger.refresh()
})

onUnmounted(() => {
  clearLongPress()
  window.clearTimeout(wheelReleaseTimer)
  cancelScrollTween()
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('portfolio:go-to-project', onAboutProjectRequest)
  window.removeEventListener('scroll', onStoryScroll)
  window.removeEventListener('wheel', onStoryWheel)
  window.removeEventListener('touchstart', onStoryTouchStart)
  window.removeEventListener('touchmove', onStoryTouchMove)
  window.removeEventListener('touchend', onStoryTouchEnd)
  if (usesNativeScrollEnd) window.removeEventListener('scrollend', onStoryScrollEnd)
  else ScrollTrigger.removeEventListener('scrollEnd', onStoryScrollEnd)
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  storyTrigger?.kill()
  sceneController?.destroy()
})
</script>

<template>
  <section
    id="web-projects"
    ref="root"
    class="projects-experience"
    :class="{'is-fallback': isFallback}"
    :style="storyStyle"
    :aria-label="t('section-title')"
  >
    <span id="portfolio" class="projects-portfolio-anchor" :style="{top: projectAnchorTop}" aria-hidden="true"></span>

    <div
      v-if="!isFallback"
      ref="stage"
      class="projects-stage"
      :class="{'is-swiping-down': isSwipingDown}"
    >
      <div class="projects-terminal" aria-hidden="true">
        <span
          v-for="(line, index) in terminalLines"
          :key="line"
          class="projects-terminal__line"
          :style="{'--terminal-index': index}"
        >{{ line }}</span>
      </div>

      <canvas
        ref="canvas"
        class="projects-canvas"
        aria-hidden="true"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="endTouchLens"
        @pointercancel="endTouchLens"
        @pointerleave="onPointerLeave"
      ></canvas>

      <div class="projects-edge projects-edge--left" aria-hidden="true"></div>
      <div class="projects-edge projects-edge--right" aria-hidden="true"></div>
      <div class="projects-scanlines" aria-hidden="true"></div>

      <header class="projects-heading">
        <p class="projects-heading__eyebrow">{{ t(activeProject.kindKey) }}</p>
        <h2>{{ t('section-title') }}</h2>
        <p>{{ t('section-intro') }}</p>
      </header>

      <div
        class="projects-copy"
        :style="{'--project-accent': activeAccent}"
        aria-live="polite"
        aria-atomic="false"
      >
        <div class="projects-copy__meta">
          <span>{{ t('project') }} {{ activeProjectIndex + 1 }}/{{ projects.length }}</span>
          <span>{{ t('frame') }} {{ activeSlideIndex + 1 }}/{{ activeProject.slides.length }}</span>
        </div>
        <p class="projects-copy__icon" aria-hidden="true">{{ activeProject.icon }}</p>
        <h3>{{ t(activeProject.titleKey) }}</h3>
        <p class="projects-copy__summary">{{ t(activeProject.summaryKey) }}</p>
        <p class="projects-copy__body">{{ normalizedText(activeSlide.copyKey) }}</p>
        <div v-if="hasGithub || hasPreview" class="projects-actions">
          <a v-if="hasGithub" :href="activeProject.links.github" target="_blank" rel="noopener noreferrer">
            {{ t('github') }}
          </a>
          <a v-if="hasPreview" :href="activeProject.links.preview" target="_blank" rel="noopener noreferrer">
            {{ t('preview') }}
          </a>
        </div>
      </div>

      <nav class="projects-navigation" :aria-label="t('section-title')">
        <button type="button" :aria-label="t('previous')" @click="goToStop(activeStopIndex - 1)">←</button>
        <div class="projects-navigation__projects">
          <button
            v-for="(project, index) in projects"
            :key="project.id"
            type="button"
            :class="{active: activeProjectIndex === index}"
            :aria-label="t(project.titleKey)"
            :aria-current="activeProjectIndex === index ? 'step' : undefined"
            @click="goToProject(index)"
          ><span></span></button>
        </div>
        <button type="button" :aria-label="t('next')" @click="goToStop(activeStopIndex + 1)">→</button>
      </nav>

      <div class="projects-progress" aria-hidden="true">
        <span :style="{width: `${progressPercent}%`}"></span>
      </div>

      <p class="projects-hint">{{ isTouch ? t('touch-hint') : t('scroll-hint') }}</p>

      <aside v-if="perfEnabled" class="projects-perf" aria-label="Performance metrics">
        <span>{{ performanceMetrics.fps.toFixed(0) }} FPS</span>
        <span>{{ performanceMetrics.frameTime.toFixed(1) }} ms</span>
        <span>DPR {{ performanceMetrics.dpr.toFixed(2) }}</span>
        <span>{{ performanceMetrics.drawCalls }} calls</span>
        <span>{{ performanceMetrics.textures }} textures</span>
        <span>{{ performanceMetrics.webgl2 ? 'WebGL2' : 'WebGL1' }}</span>
      </aside>

      <div class="projects-sr-only" aria-label="All project content">
        <article v-for="project in projects" :key="project.id">
          <h3>{{ t(project.titleKey) }}</h3>
          <p>{{ t(project.summaryKey) }}</p>
          <p v-for="slide in project.slides" :key="slide.copyKey">{{ normalizedText(slide.copyKey) }}</p>
        </article>
      </div>
    </div>

    <div v-else class="projects-fallback">
      <header class="projects-fallback__heading">
        <p>{{ t('fallback-title') }}</p>
        <h2>{{ t('section-title') }}</h2>
        <p>{{ t('fallback-description') }}</p>
      </header>
      <article v-for="project in projects" :key="project.id" class="projects-fallback__project">
        <div class="projects-fallback__media">
          <img
            :src="project.slides[0].type === 'video' ? project.slides[0].poster : project.slides[0].src"
            :alt="t(project.titleKey)"
          >
        </div>
        <div>
          <p class="projects-fallback__kind">{{ t(project.kindKey) }}</p>
          <h3>{{ t(project.titleKey) }}</h3>
          <p>{{ t(project.summaryKey) }}</p>
          <ol>
            <li v-for="slide in project.slides" :key="slide.copyKey">{{ normalizedText(slide.copyKey) }}</li>
          </ol>
          <div v-if="project.links.github || project.links.preview" class="projects-actions">
            <a v-if="project.links.github" :href="project.links.github" target="_blank" rel="noopener noreferrer">{{ t('github') }}</a>
            <a v-if="project.links.preview" :href="project.links.preview" target="_blank" rel="noopener noreferrer">{{ t('preview') }}</a>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
