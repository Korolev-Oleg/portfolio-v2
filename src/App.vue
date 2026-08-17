<script setup>
import {onMounted} from 'vue';
import translationStore from '@/store/global.js';
import {loadResources, syncLocale} from '@/utils.js';

import LoadingScreen from "@/components/Service/LoadingScreen.vue";
import ScrollBar from "@/components/Service/scrollBar.vue";
import About from "@/components/Content/about.vue";
import Portfolio from "@/components/Portfolio/portfolio.vue"
import WebProjects from "@/components/WebProjects/WebProjects.vue";
import Footer from "@/components/Footer/footer.vue";
import Header from "@/components/Header/header.vue";


onMounted(async () => {
  await loadResources()
  syncLocale(translationStore);
  window.scrollTo(0, 0);

})
</script>

<template>
  <LoadingScreen/>
  <ScrollBar/>
  <Header/>
  <About/>
  <WebProjects/>
  <Portfolio/>
  <Footer/>
</template>


<style>
body {
  overflow-x: hidden;
}

#app {
  padding: 0;
  background: var(--color-background);
  overflow-x: hidden;
  max-width: 100vw;
  grid-template-columns: 1fr;
}
</style>
