<script setup>
import '@/components/Header/css/header.css';

import ProfilePhoto1 from "@/components/Header/asserts/profilePhoto1.webp";
import ProfilePhoto2 from "@/components/Header/asserts/profilePhoto2.webp";
import PythonIcon2 from "@/components/Header/icons/PythonIcon2.vue";
import FastAPIicon from "@/components/Header/icons/FastAPIicon.vue";
import DjangoIcon from "@/components/Header/icons/DjangoIcon.vue";
import PostgresIcon from "@/components/Header/icons/PostgresIcon.vue";
import JSIcon from "@/components/Header/icons/JSIcon.vue";
import VueIcon from "@/components/Header/icons/VueIcon.vue";
import AutoitIcon from "@/components/Header/icons/AutoitIcon.vue";
import translations from '@/translations/aboutTranslations.json';
import Telegram from "@/components/Header/icons/telegram.vue";
import Github from "@/components/Header/icons/github.vue";
import Linkedin from "@/components/Header/icons/linkedin.vue";
import {loader} from "@/store/global.js";
import {onMounted, onUnmounted, watch} from "vue";
import TextPlugin from "gsap/TextPlugin";
import gsap from 'gsap';
import {executeHeaderAnimations} from "@/components/Header/animations/headerAnimations.js";
import {initTranslations} from "@/utils.js";

const _ = initTranslations(translations)

gsap.registerPlugin(TextPlugin);
let animationContext

watch(() => loader.isLoading, (isLoading) => {
  if (!isLoading) {
    animationContext = gsap.context(() => executeHeaderAnimations())
  }
})

onMounted(() => {
  window.scrollTo(0, 0);
})

onUnmounted(() => animationContext?.revert())

</script>

<template>
  <a class="skip-link" href="#about">Skip to main content</a>
  <div class="head">
    <div class="container">
      <div class='flex'>
        <div class="photo">
          <div class="img-mask">
            <img id='profile-photo' :src="ProfilePhoto1" alt="Oleg Korolev">
            <img id='profile-photo-2' :src="ProfilePhoto2" alt="Oleg Korolev portrait">
          </div>
          <p id="image-title">FULLSTACK WEB DEVELOPER</p>
        </div>
        <div class="skills-icons">
          <ul>
            <li>
              <PythonIcon2 id="python-icon"/>
              <span id="python"></span>
            </li>
            <li>
              <FastAPIicon id="fastapi-icon"/>
              <span id="fastapi"></span>
            </li>
            <li>
              <DjangoIcon id="django-icon"/>
              <span id="django"></span>
            </li>
            <li>
              <PostgresIcon id="postgres-icon"/>
              <span id="postgres"></span>
            </li>
            <li>
              <JSIcon id="js-icon"/>
              <span id="js"></span>
            </li>
            <li>
              <VueIcon id="vue-icon"/>
              <span id="vue"></span>
            </li>
            <li>
              <AutoitIcon id="autoit-icon"/>
              <span id="autoit"></span>
            </li>
          </ul>
        </div>
        <div class="hidden-container">
          <span id="name-hidden"></span>
          <div class="hidden-socials" aria-label="Social links">
            <a class="h-telegram hidden" aria-label="Telegram" href="https://t.me/okorolev_dev" target="_blank" rel="noopener noreferrer">
              <Telegram/>
            </a>
            <a class="h-github hidden" aria-label="GitHub" href="https://github.com/korolev-oleg" target="_blank" rel="noopener noreferrer">
              <Github/>
            </a>
            <a class="h-linkedin hidden" aria-label="LinkedIn" href="https://www.linkedin.com/in/korolev-oleg" target="_blank" rel="noopener noreferrer">
              <Linkedin/>
            </a>
          </div>
        </div>
      </div>
      <h1 id="name">{{ _('name') }}</h1>
    </div>
  </div>
</template>
