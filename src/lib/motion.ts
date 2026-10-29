import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import type Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export { gsap, ScrollTrigger, useGSAP }

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

export const isMotionStopped = () => motionStopped

export function setMotionStopped(stopped: boolean) {
  motionStopped = stopped
  gsap.globalTimeline.timeScale(stopped ? 1000 : 1)
  if (lenis) lenis.options.lerp = stopped ? 1 : 0.09
}

export const prefersReducedMotion = () =>
  motionStopped || window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const hasFinePointer = () => window.matchMedia('(pointer: fine)').matches

// Instancia compartida de Lenis para poder pausar el scroll o saltar a una sección.
let lenis: Lenis | null = null

export function setLenis(instance: Lenis | null) {
  lenis = instance
  if (lenis && motionStopped) lenis.options.lerp = 1
}

export function scrollToTarget(target: string | number, immediate = false, duration = 1.4) {
  if (lenis) {
    lenis.scrollTo(target, { offset: 0, immediate, duration })
    return
  }
  if (typeof target === 'number') window.scrollTo({ top: target })
  else document.querySelector(target)?.scrollIntoView()
}

export function lockScroll(locked: boolean) {
  if (locked) lenis?.stop()
  else lenis?.start()
  document.documentElement.classList.toggle('is-locked', locked)
}
