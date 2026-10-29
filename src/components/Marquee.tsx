import { Fragment, useEffect, useRef } from 'react'
import { gsap, isMotionStopped, prefersReducedMotion, ScrollTrigger } from '../lib/motion'
import { MothLogo } from './MothLogo'

// Cinta de texto infinita que acelera y cambia de sentido con el scroll.
export function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const track = trackRef.current
    if (!root || !track || prefersReducedMotion()) return
    const base = reverse ? -1 : 1
    let x = 0
    let dir = 1
    let boost = 0
    // El ancho se mide solo al cambiar de tamaño: leerlo en cada frame fuerza un layout.
    let half = track.scrollWidth / 2
    const ro = new ResizeObserver(() => (half = track.scrollWidth / 2))
    ro.observe(track)

    const setX = gsap.quickSetter(track, 'x', 'px')
    const tick = (_time: number, delta: number) => {
      if (isMotionStopped()) return
      boost *= 0.94
      x -= (0.6 + boost) * dir * base * delta * 0.06
      x = gsap.utils.wrap(-half, 0, x)
      setX(x)
    }

    // Solo anima mientras está en pantalla.
    let running = false
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === running) return
      running = entry.isIntersecting
      if (running) gsap.ticker.add(tick)
      else gsap.ticker.remove(tick)
    })
    io.observe(root)

    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        dir = self.direction
        boost = Math.min(Math.abs(self.getVelocity()) / 300, 10)
      },
    })

    return () => {
      st.kill()
      io.disconnect()
      ro.disconnect()
      gsap.ticker.remove(tick)
    }
  }, [reverse])

  const content = items.map((item, i) => (
    <Fragment key={i}>
      <span className={i % 2 ? 'marquee__outline' : ''}>{item}</span>
      <MothLogo size={44} />
    </Fragment>
  ))

  return (
    <div ref={rootRef} className="marquee" aria-hidden="true">
      <div ref={trackRef} className="marquee__track">
        {content}
        {content}
      </div>
    </div>
  )
}
