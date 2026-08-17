import {loader} from "@/store/global.js";
import translationStore from "@/store/global.js";

export function syncLocale(translationStore) {
  const userLanguage = navigator.language || navigator.userLanguage;
  if (userLanguage.startsWith('ru')) {
    translationStore.currentLocale = 'ru';
  } else {
    translationStore.currentLocale = 'en';
  }
  document.getElementsByTagName('html')[0].lang = translationStore.currentLocale
}

export function generateID(name, length = 5) {
  return `${name}-${Math.random().toString(36).substr(2, length)}`
}

export function isElementVisible(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export async function loadResources() {
  const resources = document.querySelectorAll('img, link[rel="stylesheet"], video');
  const totalResources = resources.length;
  let loadedResources = 0;

  if (totalResources === 0) {
    loader.progress = 100;
    loader.isLoading = false;
    return;
  }

  const updateProgress = (resolve) => {
    loadedResources++;
    const progress = Math.round((loadedResources / totalResources) * 100);
    loader.progress = progress;
    if (loadedResources === totalResources) resolve();
  };

  const waitForResources = new Promise((resolve) => {
    resources.forEach((resource) => {
      const isReady = resource.tagName === 'IMG'
        ? resource.complete
        : resource.tagName === 'VIDEO'
          ? resource.readyState >= 1
          : Boolean(resource.sheet);

      if (isReady) {
        updateProgress(resolve);
        return;
      }

      let handled = false;
      const done = () => {
        if (handled) return;
        handled = true;
        updateProgress(resolve);
      };
      resource.addEventListener('load', done, {once: true});
      resource.addEventListener('error', done, {once: true});
      resource.addEventListener('loadedmetadata', done, {once: true});
    });
  });

  const timeout = new Promise((resolve) => setTimeout(resolve, 4000));
  await Promise.race([waitForResources, timeout]);
  loader.progress = 100;
  loader.isLoading = false;
}

export function initTranslations(translations) {
  return (key) => {
    syncLocale(translationStore)
    return translations[translationStore.currentLocale][key]
  }
}

export function getDeviceType() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/android/i.test(userAgent)) {
    return 'Mobile';
  }

  if (/iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'Mobile';
  }

  if (window.innerWidth < 768) {
    return 'Mobile';
  }

  return 'Desktop';
}

export default {generateID, syncLocale, isElementVisible};
