<script setup>
import translations from '@/translations/aboutTranslations.json';
import {loader} from "@/store/global.js";
import gsap from 'gsap';
import {onUnmounted, watch} from "vue";
import TextPlugin from "gsap/TextPlugin";
import ScrollTrigger from "gsap/ScrollTrigger";
import {initTranslations} from "@/utils.js";
import {executeContentAnimations} from "@/components/Content/animations/contentAnimations.js";

const _ = initTranslations(translations)

gsap.registerPlugin(TextPlugin)
gsap.registerPlugin(ScrollTrigger);

const toSpace = (str) => {
  return str.replace(/[\w\W]/g, '‎ ');
}

let animationContext

watch(() => loader.isLoading, (isLoading) => {
  if (!isLoading) {
    animationContext = gsap.context(() => executeContentAnimations())
  }
})

onUnmounted(() => animationContext?.revert())
</script>
<template>
  <section id="about">
    <div class="container">
      <div class="text">
        <!--    <button @click='translationStore.currentLocale="ru"'>ru</button>-->
        <!--    <button @click='translationStore.currentLocale="en"'>en</button>-->
        <p id="about-citation-1" skip>{{ _('about-citation-1') }}</p>
        <p id="about-citation-2" skip>{{ _('about-citation-2') }}</p>
        <p id='about-2022-2024'>{{ toSpace(_('about-2022-2024')) }}</p>
        <p id='about-2021'>{{ toSpace(_('about-2021')) }}</p>
        <p id='about-2020'>{{ toSpace(_('about-2020')) }}</p>
        <p id='about-2019'>{{ toSpace(_('about-2019')) }}</p>
        <p id='about-2017'>{{ toSpace(_('about-2017')) }}</p>
        <p id="about-2016">{{ toSpace(_('about-2016')) }}</p>
        <p id="about-2015">{{ toSpace(_('about-2015')) }}</p>
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

.text {
  min-height: 1846px;
  padding-top: 314px;
  color: var(--color-text);
  display: block;
  overflow: hidden;
}

#about {
  overflow-x: hidden;
  background: var(--color-background);
}
</style>
