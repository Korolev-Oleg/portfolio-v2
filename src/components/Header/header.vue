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
import {onMounted, watch} from "vue";
import TextPlugin from "gsap/TextPlugin";
import gsap from 'gsap';
import {executeHeaderAnimations} from "@/components/Header/animations/headerAnimations.js";
import {initTranslations} from "@/utils.js";

const _ = initTranslations(translations)

gsap.registerPlugin(TextPlugin);

watch(loader.isLoading, (isLoading) => {
  executeHeaderAnimations()
})

onMounted(() => {
  window.scrollTo(0, 0);
})

</script>

<template>
  <div class="head">
    <div class="container">
      <div class='flex'>
        <div class="photo">
          <div class="img-mask">
            <img id='profile-photo' :src="ProfilePhoto1" alt="">
            <img id='profile-photo-2' :src="ProfilePhoto2" alt="">
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
          <div class="hidden-socials">
            <a class="h-telegram hidden" href="https://t.me/okorolev_dev" target="_blank">
              <Telegram/>
            </a>
            <a class="h-github hidden" href="https://github.com/korolev-oleg" target="_blank">
              <Github/>
            </a>
            <a class="h-linkedin hidden" href="https://www.linkedin.com/in/korolev-oleg" target="_blank">
              <Linkedin/>
            </a>
          </div>
        </div>
      </div>
      <div id="name">{{ _('name') }}</div>
    </div>
  </div>
</template>
