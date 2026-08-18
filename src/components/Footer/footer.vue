<script setup>
import PyCharm from "@/components/Footer/icons/PyCharm.vue";
import Figma from "@/components/Footer/icons/Figma.vue";
import Telegram from "@/components/Header/icons/telegram.vue";
import Github from "@/components/Header/icons/github.vue";
import Linkedin from "@/components/Header/icons/linkedin.vue";
import VueColored from "@/components/Footer/icons/VueColored.vue";
import GsapIcon from "@/components/Footer/icons/GsapIcon.vue";
import translation from "@/translations/footerTranslations.json";
import {initTranslations} from "@/utils.js";

const _ = initTranslations(translation)

</script>
<template>
  <footer id="contact">
    <div class="row">
      <p>{{_('mind-title')}}</p>
      <div class="icons" aria-label="Tools used">
        <PyCharm aria-label="PyCharm"/>
        <VueColored aria-label="Vue"/>
        <GsapIcon aria-label="GSAP"/>
        <a aria-label="Portfolio design in Figma" href="https://www.figma.com/design/YDCaTj1eoUg4FhTlPsKXBI/Untitled?node-id=18-16968&t=EoZa8WinitgN2kJs-1" target="_blank" rel="noopener noreferrer">
          <Figma/>
        </a>
      </div>
    </div>
    <div class="row">
      <p>{{_('connect-title')}}</p>
      <div class="icons">
        <a aria-label="Telegram" href="https://t.me/okorolev_dev" target="_blank" rel="noopener noreferrer">
          <Telegram/>
        </a>
        <a aria-label="GitHub" href="https://github.com/korolev-oleg" target="_blank" rel="noopener noreferrer">
          <Github/>
        </a>
        <a class="h-linkedin" aria-label="LinkedIn" href="https://www.linkedin.com/in/korolev-oleg" target="_blank" rel="noopener noreferrer">
          <Linkedin/>
        </a>
      </div>
    </div>

  </footer>
</template>

<style scoped>
footer {
  background: var(--color-background);
  color: var(--color-text);
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  align-items: center;
  align-content: center;
  border-radius: 44px 44px 0 0;
  text-align: center;
  font-size: 20px;
  margin-top: 20px;
  position: relative;
  z-index: 300!important;
}
@media(min-width: 800px){
  footer{
    display: flex;
    flex-direction: row;
    align-items: start;
    padding: 100px;
  }
}

footer > .timeline {
  height: 600px;
}

.icons {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
}
.icons a {
  color: black;
}
</style>
