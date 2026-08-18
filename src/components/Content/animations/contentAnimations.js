import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrambleText from "@/libs/scrambleText.js";
import {initTranslations, isElementVisible} from "@/utils.js";
import translations from "@/translations/aboutTranslations.json";

const _ = initTranslations(translations)
gsap.registerPlugin(ScrollTrigger)

const lockAboutLayout = () => {
  const text = document.querySelector('#about .text')
  if (!text || !text.parentElement) return () => {}

  const measure = () => {
    const clone = text.cloneNode(true)
    const width = text.getBoundingClientRect().width

    Object.assign(clone.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${width}px`,
      height: 'auto',
      minHeight: '0',
      maxHeight: 'none',
      overflow: 'visible',
      visibility: 'hidden',
      pointerEvents: 'none',
    })
    clone.setAttribute('aria-hidden', 'true')

    clone.querySelectorAll('p[id]').forEach((paragraph) => {
      const copy = _(paragraph.id)
      if (copy) paragraph.textContent = copy
    })

    text.parentElement.appendChild(clone)
    const height = Math.ceil(clone.getBoundingClientRect().height)
    clone.remove()

    if (height > 0) {
      text.style.height = `${height}px`
      text.style.minHeight = `${height}px`
    }
  }

  measure()

  let resizeFrame = 0
  const onResize = () => {
    window.cancelAnimationFrame(resizeFrame)
    resizeFrame = window.requestAnimationFrame(measure)
  }
  window.addEventListener('resize', onResize, {passive: true})

  return () => {
    window.removeEventListener('resize', onResize)
    window.cancelAnimationFrame(resizeFrame)
    text.style.removeProperty('height')
    text.style.removeProperty('min-height')
  }
}

export function executeContentAnimations() {
  const markers = false;
  const start = 'top 80%';
  const end = 'bottom 80%';
  const scrub = 4;
  const tl = gsap.timeline();
  // const chars = ["コ", "ー", "ヒ", "比", "ス", "阝", "プ", "ビ", "州", "ル", "ワ", "イ", "ン", "小", "贝", "比", "巴", "小", "井", "己", "工"]
  const chars = ['0', '1'];
  const media = gsap.matchMedia(),
    breakPoint = 800
  const releaseAboutLayout = lockAboutLayout()

  tl.to('#about-citation-1', {
    call: () => {
      new ScrambleText(document.getElementById('about-citation-1'), {
        timeOffset: 20,
        chars: chars
      }).start().play();
    }
  })
    .to('.about-reveal', {
      call: () => {
        document.querySelectorAll('.about-reveal').forEach((element) => {
          new ScrambleText(element, {
            timeOffset: 35,
            chars: chars,
          }).start().play();
        });
      }
    }, '<')
  media.add(
    {
      // set up any number of arbitrarily-named conditions. The function below will be called when ANY of them match.
      isDesktop: `(min-width: ${breakPoint}px)`,
      isMobile: `(max-width: ${breakPoint - 1}px)`,
    },
    (context) => {
      // typing paragraphs by scrolling down
      const paragraphs = document.querySelectorAll('.text p');
      let {isDesktop, isMobile} = context.conditions;

      const revealStates = []

      paragraphs.forEach((paragraph, index) => {
        // scrable text
        // if (isElementVisible(paragraph) && paragraph.innerText.replace(/\s+/g, '')) {
        //   gsap.to(`#${paragraph.id}`, {
        //     call: () => {
        //       new ScrambleText(paragraph, {
        //         timeOffset: isMobile ? 2 : 1,
        //         chars: chars
        //       }).start().play();
        //     }
        //   }, '<');
        // }
        if (paragraph.hasAttribute('skip')) {
          return null;
        }

        const sequenceIndex = revealStates.length
        const state = {
          animation: gsap.to(paragraph, {
            duration: 1,
            text: _(paragraph.id),
            opacity: 1,
            ease: 'power2.inOut',
            immediateRender: false,
            paused: true,
          }),
          complete: false,
        }
        revealStates.push(state)

        ScrollTrigger.create({
          trigger: paragraph,
          animation: state.animation,
          start: 'top 40%',
          end: 'top 18%',
          scrub,
          markers,
          onUpdate: (self) => {
            const previous = revealStates[sequenceIndex - 1]
            const movingForward = self.direction >= 0
            const canAdvance = !movingForward || !previous || previous.complete

            if (!canAdvance) {
              state.complete = false
              state.animation.progress(0)
              return
            }

            state.animation.progress(self.progress)
            state.complete = self.progress >= 0.999
          },
        })

      })
    }
  )

  return releaseAboutLayout
}
