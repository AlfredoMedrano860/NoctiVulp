import { useRef, type ElementType, type ReactNode } from 'react'
import { gsap, prefersReducedMotion, SplitText, useGSAP } from '../lib/motion'

interface SplitRevealProps {
  as?: ElementType
  children: ReactNode
  className?: string
  delay?: number
  // Si es false, la animación no espera al scroll (útil en el hero).
  onScroll?: boolean
  play?: boolean
}

// Divide el texto en líneas enmascaradas que suben al entrar en pantalla.
export function SplitReveal({
  as: Tag = 'div',
  children,
  className,
  delay = 0,
  onScroll = true,
  play = true,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || !play || prefersReducedMotion()) return
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 115,
            rotate: 2,
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.09,
            delay,
            scrollTrigger: onScroll ? { trigger: el, start: 'top 88%', once: true } : undefined,
          }),
      })
    },
    { dependencies: [play], scope: ref },
  )

  return (
    <Tag ref={ref} className={`${className ?? ''} ${play ? '' : 'is-pending'}`}>
      {children}
    </Tag>
  )
}
