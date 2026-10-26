import { useRef } from 'react'
import { gsap, useGSAP } from '../lib/motion'

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.to(ref.current, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    })
  })

  return <div ref={ref} className="scroll-progress" aria-hidden="true" />
}
