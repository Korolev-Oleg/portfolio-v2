<script setup>
import translations from '@/translations/aboutTranslations.json';
import {loader} from "@/store/global.js";
import gsap from 'gsap';
import {nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import TextPlugin from "gsap/TextPlugin";
import ScrollTrigger from "gsap/ScrollTrigger";
import {initTranslations} from "@/utils.js";
import {executeContentAnimations} from "@/components/Content/animations/contentAnimations.js";

const _ = initTranslations(translations)

gsap.registerPlugin(TextPlugin)
gsap.registerPlugin(ScrollTrigger);

const toSpace = () => {
  // A repeated invisible marker creates wrapped line boxes in Chromium/WebKit,
  // which makes unrevealed paragraphs look expanded. Keep one stable line
  // until TextPlugin starts typing the real copy.
  return '\u00a0';
}

const openPresentation = (projectId) => {
  window.dispatchEvent(new CustomEvent('portfolio:go-to-project', {
    detail: {projectId},
  }))
}

const aboutTextExpanded = ref(false)
let aboutTextObserver

const normalizedText = (value) => value.replace(/\u00a0/g, '').trim()

const updateAboutTextState = () => {
  const paragraphs = [...document.querySelectorAll('#about .text p[id]')]
  if (!paragraphs.length) return

  aboutTextExpanded.value = paragraphs.every((paragraph) => {
    const expected = normalizedText(_(paragraph.id) || '')
    const actual = normalizedText(paragraph.textContent || '')
    const opacity = Number.parseFloat(getComputedStyle(paragraph).opacity)
    return actual === expected && (paragraph.hasAttribute('skip') || opacity >= 0.99)
  })
}

const requestPresentation = (projectId) => {
  if (aboutTextExpanded.value) {
    openPresentation(projectId)
    return
  }

  const about = document.getElementById('about')
  if (!about) return

  const aboutTop = about.getBoundingClientRect().top + window.scrollY
  const target = Math.max(
    window.scrollY,
    aboutTop + about.offsetHeight - window.innerHeight + 8,
  )
  window.scrollTo({top: target, behavior: 'smooth'})
}

let animationContext
let releaseAboutLayout
let hasStartedAnimations = false

const startAnimations = async () => {
  if (loader.isLoading || hasStartedAnimations) return
  await nextTick()
  if (loader.isLoading || hasStartedAnimations) return

  hasStartedAnimations = true
  animationContext = gsap.context(() => {
    releaseAboutLayout = executeContentAnimations()
  })
}

watch(() => loader.isLoading, startAnimations, {immediate: true})
onMounted(startAnimations)

onMounted(async () => {
  await nextTick()
  updateAboutTextState()
  const text = document.querySelector('#about .text')
  if (!text) return

  aboutTextObserver = new MutationObserver(updateAboutTextState)
  aboutTextObserver.observe(text, {subtree: true, characterData: true, childList: true})
})

onUnmounted(() => {
  aboutTextObserver?.disconnect()
  releaseAboutLayout?.()
  animationContext?.revert()
})
</script>
<template>
  <section id="about">
    <div class="container">
      <div class="text">
        <!--    <button @click='translationStore.currentLocale="ru"'>ru</button>-->
        <!--    <button @click='translationStore.currentLocale="en"'>en</button>-->
        <p id="about-citation-1" class="about-first" skip>{{ _('about-citation-1') }}</p>
        <p id="about-citation-2" class="about-reveal">{{ _('about-citation-2') }}</p>
        <div class="about-entry">
          <button type="button" class="about-entry__mark about-entry__mark--luchi" :class="{'is-pending': !aboutTextExpanded}" :aria-disabled="!aboutTextExpanded" :aria-label="aboutTextExpanded ? _('about-open-presentation') : _('about-expand-first')" @click="requestPresentation('cleaning-service')">LZ</button>
          <p id='about-2025-2026'>{{ toSpace(_('about-2025-2026')) }}</p>
        </div>
        <div class="about-entry">
          <button type="button" class="about-entry__mark about-entry__mark--intelion" :class="{'is-pending': !aboutTextExpanded}" :aria-disabled="!aboutTextExpanded" :aria-label="aboutTextExpanded ? _('about-open-presentation') : _('about-expand-first')" @click="requestPresentation('gpu-ark')">IM</button>
          <p id='about-2024-2025'>{{ toSpace(_('about-2024-2025')) }}</p>
        </div>
        <div class="about-entry">
          <button type="button" class="about-entry__mark about-entry__mark--aktikom" :class="{'is-pending': !aboutTextExpanded}" :aria-disabled="!aboutTextExpanded" :aria-label="aboutTextExpanded ? _('about-open-presentation') : _('about-expand-first')" @click="requestPresentation('titan-control')">AK</button>
          <p id='about-2022-2024'>{{ toSpace(_('about-2022-2024')) }}</p>
        </div>
        <div class="about-entry">
          <button type="button" class="about-entry__mark about-entry__mark--prodlogistica" :class="{'is-pending': !aboutTextExpanded}" :aria-disabled="!aboutTextExpanded" :aria-label="aboutTextExpanded ? _('about-open-presentation') : _('about-expand-first')" @click="requestPresentation('prodlogistica-app')">PL</button>
          <p id='about-2020-2021'>{{ toSpace(_('about-2020-2021')) }}</p>
        </div>
        <div class="about-entry">
          <button type="button" class="about-entry__mark about-entry__mark--skm" :class="{'is-pending': !aboutTextExpanded}" :aria-disabled="!aboutTextExpanded" :aria-label="aboutTextExpanded ? _('about-open-presentation') : _('about-expand-first')" @click="requestPresentation('tend-manager')">SK</button>
          <p id='about-2019-2020'>{{ toSpace(_('about-2019-2020')) }}</p>
        </div>
        <div class="about-entry">
          <button type="button" class="about-entry__mark about-entry__mark--web" :class="{'is-pending': !aboutTextExpanded}" :aria-disabled="!aboutTextExpanded" :aria-label="aboutTextExpanded ? _('about-open-presentation') : _('about-expand-first')" @click="requestPresentation('cleaning-service')">WEB</button>
          <p id='about-2017'>{{ toSpace(_('about-2017')) }}</p>
        </div>
        <div class="about-entry">
          <button type="button" class="about-entry__mark about-entry__mark--mfc" :class="{'is-pending': !aboutTextExpanded}" :aria-disabled="!aboutTextExpanded" :aria-label="aboutTextExpanded ? _('about-open-presentation') : _('about-expand-first')" @click="requestPresentation('prodlogistica-web')">M</button>
          <p id="about-2016">{{ toSpace(_('about-2016')) }}</p>
        </div>
        <div class="about-entry">
          <button type="button" class="about-entry__mark about-entry__mark--autoit" :class="{'is-pending': !aboutTextExpanded}" :aria-disabled="!aboutTextExpanded" :aria-label="aboutTextExpanded ? _('about-open-presentation') : _('about-expand-first')" @click="requestPresentation('tend-manager')">AU</button>
          <p id="about-2015">{{ toSpace(_('about-2015')) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
p {
  font-size: 16px;
  margin: 25px 0;
  display: block;
}

.about-entry {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: clamp(10px, 1.5vw, 20px);
  align-items: start;
}

.about-entry__mark {
  -webkit-appearance: none;
  appearance: none;
  padding: 0;
  display: grid;
  width: 24px;
  height: 24px;
  margin-top: 25px;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 6px;
  color: #7196ff;
  background: linear-gradient(145deg, rgba(113, 150, 255, .18), rgba(113, 150, 255, .03));
  box-shadow: inset 0 0 18px rgba(113, 150, 255, .12), 0 0 18px rgba(113, 150, 255, .08);
  font-family: Hack, "SFMono-Regular", Consolas, monospace;
  font-size: .42rem;
  font-weight: 700;
  letter-spacing: -.04em;
  line-height: 1;
  cursor: pointer;
  transition: transform .35s ease, box-shadow .35s ease;
}

.about-entry__mark:focus-visible {
  outline: 3px solid #4f8cff;
  outline-offset: 4px;
}

.about-entry:hover .about-entry__mark {
  transform: translateY(-2px) rotate(-3deg);
  box-shadow: inset 0 0 18px rgba(113, 150, 255, .2), 0 5px 24px rgba(113, 150, 255, .14);
}

.about-entry__mark--luchi { color: #ef7658; }
.about-entry__mark--intelion { color: #6dd5ff; }
.about-entry__mark--aktikom { color: #a786ff; }
.about-entry__mark--prodlogistica { color: #31ac53; }
.about-entry__mark--skm { color: #f0c45f; }
.about-entry__mark--web { color: #55c9ff; }
.about-entry__mark--mfc { color: #f28c78; }
.about-entry__mark--autoit { color: #b4a0ff; }

.text {
  min-height: 1846px;
  padding-top: 314px;
  color: var(--color-text);
  display: block;
  overflow: hidden;
  overflow-anchor: none;
}

.about-reveal {
  opacity: 1;
}

#about {
  overflow-x: hidden;
  overflow-anchor: none;
  background: var(--color-background);
}

@media (max-width: 600px) {
  .about-entry {
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 8px;
  }

  .about-entry__mark {
    width: 24px;
    height: 24px;
    margin-top: 25px;
    border-radius: 6px;
    font-size: .42rem;
  }
}
</style>
