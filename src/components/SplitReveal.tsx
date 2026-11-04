import { useRef, type ElementType, type ReactNode } from 'react'
import { gsap, loadSplitText, prefersReducedMotion, useGSAP } from '../lib/motion'
import { onReach } from '../lib/scroll'

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
      // con onScroll, las líneas esperan escondidas hasta que el título llega al 88 % de la pantalla
      let reached = !onScroll
      let played = false
      let tween: gsap.core.Tween | undefined
      let stopReach: (() => void) | undefined
      const create = contextSafe((SplitText: Awaited<ReturnType<typeof loadSplitText>>) => {
        if (!alive) return
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          aria: 'none',
          linesClass: 'split-line',
          autoSplit: true,
          // autoSplit vuelve a partir el texto si cambia el ancho: solo se anima la primera vez
          onSplit: (self) => {
            if (played) return
            tween = gsap.from(self.lines, {
              yPercent: 115,
              rotate: 2,
              duration: 1.2,
              ease: 'expo.out',
              stagger: 0.09,
              delay,
              paused: !reached,
              onStart: () => {
                played = true
              },
            })
            return tween
          },
        })
        if (!reached)
          stopReach = onReach(el, () => {
            reached = true
            tween?.play()
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
        stopReach?.()
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
