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

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const hasFinePointer = () => window.matchMedia('(pointer: fine)').matches

// Instancia compartida de Lenis para poder pausar el scroll o saltar a una sección.
let lenis: Lenis | null = null

export function setLenis(instance: Lenis | null) {
  lenis = instance
}

export function scrollToTarget(target: string | number, immediate = false) {
  if (lenis) {
    lenis.scrollTo(target, { offset: 0, immediate, duration: 1.4 })
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
