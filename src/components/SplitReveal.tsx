import { useRef, type ElementType, type ReactNode } from 'react'
import { gsap, loadSplitText, prefersReducedMotion, useGSAP } from '../lib/motion'

void loadSplitText()

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
    (_context, contextSafe) => {
      const el = ref.current
      if (!el || !play || prefersReducedMotion() || !contextSafe) return
      let alive = true
      const create = contextSafe((SplitText: Awaited<ReturnType<typeof loadSplitText>>) => {
        if (!alive) return
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          aria: 'none',
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
      })
      const split = () => void loadSplitText().then(create)
      if (!onScroll) {
        split()
        return () => {
          alive = false
        }
      }
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          io.disconnect()
          split()
        },
        { rootMargin: '50% 0px' },
      )
      io.observe(el)
      return () => {
        alive = false
        io.disconnect()
      }
    },
    { dependencies: [play], scope: ref },
  )

  return (
    <Tag ref={ref} className={`${className ?? ''} ${play ? '' : 'is-pending'}`}>
      {children}
    </Tag>
  )
}
