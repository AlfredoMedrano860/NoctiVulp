import { useEffect, useRef } from 'react'
import { gsap } from '../lib/motion'

interface RollingTextProps {
  text: string
  // 1 = el texto nuevo entra desde abajo, -1 = desde arriba.
  direction?: number
  className?: string
  delay?: number
}

// Texto enmascarado que "rueda" al cambiar: el viejo sale y el nuevo entra.
export function RollingText({ text, direction = 1, className = '', delay = 0 }: RollingTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const last = el.lastElementChild
    if (last?.textContent === text) return

    const outgoing = Array.from(el.children)
    const incoming = document.createElement('span')
    incoming.className = 'roll__item'
    incoming.textContent = text
    el.appendChild(incoming)
    if (outgoing.length === 0) return

    const dir = direction
    gsap.fromTo(
      incoming,
      { yPercent: 115 * dir },
      { yPercent: 0, duration: 1, ease: 'expo.out', delay },
    )
    gsap.to(outgoing, {
      yPercent: -115 * dir,
      duration: 1,
      ease: 'expo.out',
      delay,
      onComplete: () => outgoing.forEach((node) => node.remove()),
    })
  }, [text, delay, direction])

  return <span ref={ref} className={`roll ${className}`} aria-label={text} />
}
