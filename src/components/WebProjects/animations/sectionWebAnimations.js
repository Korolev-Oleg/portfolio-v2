import gsap from "gsap";

export function runWebAnimations(swiper) {
  gsap.from('#web-projects h2', {
    scrollTrigger: {
      trigger: '#web-projects h2',
      start: 'top center',
      end: 'top center',
      scrub: 1,
    },
    x: '-100vw',
    duration: 1,
  })
  gsap.from('#web-projects .swiper-pagination', {
    scrollTrigger: {
      trigger: '#web-projects .swiper-pagination',
      start: 'top center',
      end: 'top center',
      scrub: 1,
    },
    x: '100vw',
    duration: 1,
  })

  gsap.fromTo(
    '#web-projects .swiper-slide',
    {autoAlpha: 0},
    {
      autoAlpha: 1,
      stagger: .1,
      duration: 1,
      scrollTrigger: {
        trigger: '#swiper-parent',
        start: 'top 85%',
        end: 'top 55%',
        scrub: .8,
      },
    }
  )

}
