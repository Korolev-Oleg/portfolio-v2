import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import VueSmoothScroll from 'vue3-smooth-scroll'

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}
window.scrollTo(0, 0)

const app = createApp(App)
app.use(VueSmoothScroll, {})
app.mount('#app')
