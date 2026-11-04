import { gsap } from 'gsap'
import type { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

// Sin ScrollTrigger: deja un requestAnimationFrame corriendo siempre. Lo ligado al
// scroll usa lib/scroll.ts.
gsap.registerPlugin(useGSAP)

export { gsap, useGSAP }

let splitText: Promise<typeof SplitText> | null = null

export function loadSplitText() {
  splitText ??= import('gsap/SplitText').then((module) => {
    gsap.registerPlugin(module.SplitText)
    return module.SplitText
  })
  return splitText
}

// "Detener animaciones" del menú de accesibilidad: las animaciones de GSAP saltan
// a su estado final y el resto del sitio se comporta como con movimiento reducido.
let motionStopped = false

export function setMotionStopped(stopped: boolean) {
  motionStopped = stopped
  gsap.globalTimeline.timeScale(stopped ? 1000 : 1)
}

export const prefersReducedMotion = () =>
  motionStopped || window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const hasFinePointer = () => window.matchMedia('(pointer: fine)').matches

// Scroll nativo del navegador. immediate: salta sin animación (al cambiar de página o con
// movimiento reducido); si no, se desplaza suave.
export function scrollToTarget(target: string | number, immediate = false) {
  const behavior: ScrollBehavior = immediate || prefersReducedMotion() ? 'instant' : 'smooth'
  if (typeof target === 'number') window.scrollTo({ top: target, behavior })
  else document.querySelector(target)?.scrollIntoView({ behavior })
}

export function lockScroll(locked: boolean) {
  document.documentElement.classList.toggle('is-locked', locked)
}
