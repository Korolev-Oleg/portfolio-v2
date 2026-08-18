import CleaningVideo from '@/components/WebProjects/video/cleaning.mp4'
import CleaningPoster from './assets/cleaning-poster.webp'
import ProdlogisticaVideo from '@/components/WebProjects/video/prodlogistica.mp4'
import ProdlogisticaPoster from './assets/prodlogistica-poster.webp'
import FruitVideo from '@/components/WebProjects/video/fruitprod.mp4'
import FruitPoster from './assets/fruitprod-poster.webp'
// import SteamVideo from '@/components/WebProjects/video/steamsales.mp4'
// import SteamPoster from './assets/steamsales-poster.webp'
import GpuArkPoster from './assets/gpu-ark-poster.webp'
import GpuArkVideo from '@/components/WebProjects/video/gpu-ark.mp4'

import TitanControlSlide1 from './assets/TitanControlSlide1.webp'
import TitanControlSlide2 from './assets/TitanControlSlide2.webp'
import ProdlogisticaSlide1 from './assets/ProdlogisticaSlide1.webp'
import ProdlogisticaSlide2 from './assets/ProdlogisticaSlide2.webp'
import ProdlogisticaSlide3 from './assets/ProdlogisticaSlide3.webp'
import ProdlogisticaSlide4 from './assets/ProdlogisticaSlide4.webp'
import TendManager1 from './assets/TendManager1.webp'
import TendManager2 from './assets/TendManager2.webp'
import TendManager3 from './assets/TendManager3.webp'
import TendManager4 from './assets/TendManager4.webp'

const videoSlide = (src, poster, copyKey) => ({
  type: 'video',
  src,
  poster,
  copyKey,
})

const imageSlide = (src, copyKey) => ({
  type: 'image',
  src,
  copyKey,
})

export const projects = [
  {
    id: 'gpu-ark',
    titleKey: 'gpu-ark-title',
    summaryKey: 'gpu-ark-summary',
    kindKey: 'kind-web',
    accent: '#f92b46',
    icon: 'GA',
    links: {
      preview: 'https://gpu-ark.ru/',
    },
    slides: [
      videoSlide(GpuArkVideo, GpuArkPoster, 'gpu-ark-slide-1'),
    ],
  },
  {
    id: 'prodlogistica-web',
    titleKey: 'prod-web-title',
    summaryKey: 'prod-web-summary',
    kindKey: 'kind-web',
    accent: '#41d66f',
    icon: 'PW',
    links: {
      github: 'https://github.com/Korolev-Oleg/Korolev-Oleg.github.io/tree/master/prodlogistica',
      preview: 'https://prodlogistica.ru/',
    },
    slides: [
      videoSlide(ProdlogisticaVideo, ProdlogisticaPoster, 'prod-web-slide-1'),
      // videoSlide(ProdlogisticaVideo, ProdlogisticaPoster, 'prod-web-slide-2'),
    ],
  },
  {
    id: 'titan-control',
    titleKey: 'titan-title',
    summaryKey: 'titan-summary',
    kindKey: 'kind-backend',
    accent: '#8d7cff',
    icon: 'TC',
    links: {},
    slides: [
      imageSlide(TitanControlSlide1, 'titan-slide-1'),
      imageSlide(TitanControlSlide2, 'titan-slide-2'),
    ],
  },
  {
    id: 'prodlogistica-app',
    titleKey: 'prod-app-title',
    summaryKey: 'prod-app-summary',
    kindKey: 'kind-backend',
    accent: '#31ac53',
    icon: 'PA',
    links: {},
    slides: [
      imageSlide(ProdlogisticaSlide1, 'prod-app-slide-1'),
      imageSlide(ProdlogisticaSlide2, 'prod-app-slide-2'),
      imageSlide(ProdlogisticaSlide3, 'prod-app-slide-3'),
      imageSlide(ProdlogisticaSlide4, 'prod-app-slide-4'),
    ],
  },
  {
    id: 'tend-manager',
    titleKey: 'tend-title',
    summaryKey: 'tend-summary',
    kindKey: 'kind-desktop',
    accent: '#0662f3',
    icon: 'TM',
    links: {
      github: 'https://github.com/Korolev-Oleg/Tend-Manager',
    },
    slides: [
      imageSlide(TendManager1, 'tend-slide-1'),
      imageSlide(TendManager3, 'tend-slide-2'),
      imageSlide(TendManager2, 'tend-slide-3'),
      imageSlide(TendManager4, 'tend-slide-4'),
    ],
  },
  {
    id: 'cleaning-service',
    titleKey: 'cleaning-title',
    summaryKey: 'cleaning-summary',
    kindKey: 'kind-web',
    accent: '#55f6c8',
    icon: 'CS',
    links: {
      github: 'https://github.com/Korolev-Oleg/Korolev-Oleg.github.io/tree/master/cleaning',
      preview: '/cleaning',
    },
    slides: [
      videoSlide(CleaningVideo, CleaningPoster, 'cleaning-slide-1'),
      // videoSlide(CleaningVideo, CleaningPoster, 'cleaning-slide-2'),
    ],
  },
  {
    id: 'fruit-catalogue',
    titleKey: 'fruit-title',
    summaryKey: 'fruit-summary',
    kindKey: 'kind-web',
    accent: '#ffba4a',
    icon: 'FC',
    links: {
      github: 'https://github.com/Korolev-Oleg/Korolev-Oleg.github.io/tree/master/fruit',
      preview: '/fruit',
    },
    slides: [
      videoSlide(FruitVideo, FruitPoster, 'fruit-slide-1'),
      // videoSlide(FruitVideo, FruitPoster, 'fruit-slide-2'),
    ],
  },
  // {
  //   id: 'steam-sales',
  //   titleKey: 'steam-title',
  //   summaryKey: 'steam-summary',
  //   kindKey: 'kind-web',
  //   accent: '#5ea8ff',
  //   icon: 'SS',
  //   links: {
  //     github: 'https://github.com/Korolev-Oleg/Korolev-Oleg.github.io/tree/master/steamsales',
  //     preview: '/steamsales',
  //   },
  //   slides: [
  //     videoSlide(SteamVideo, SteamPoster, 'steam-slide-1'),
  //     videoSlide(SteamVideo, SteamPoster, 'steam-slide-2'),
  //   ],
  // },
]

export const storyStops = projects.flatMap((project, projectIndex) =>
  project.slides.map((slide, slideIndex) => ({
    project,
    projectIndex,
    slide,
    slideIndex,
  })),
)

export const webProjectStopCount = projects
  .slice(0, 4)
  .reduce((count, project) => count + project.slides.length, 0)
