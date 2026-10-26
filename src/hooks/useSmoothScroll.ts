import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, prefersReducedMotion, ScrollTrigger, setLenis } from '../lib/motion'

export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({ lerp: 0.09, anchors: { offset: 0 } })
    setLenis(lenis)
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      setLenis(null)
    }
  }, [])
}
