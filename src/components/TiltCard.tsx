import { useEffect, useRef, type ReactNode } from 'react'
import { gsap, hasFinePointer } from '../lib/motion'

// Tarjeta que se inclina hacia el cursor y lleva un foco de luz que lo sigue.
export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !hasFinePointer()) return
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' })
    gsap.set(el, { transformPerspective: 900 })

    // Se mide al entrar, no en cada movimiento.
    let r = el.getBoundingClientRect()
    const onEnter = () => (r = el.getBoundingClientRect())
    const onMove = (e: PointerEvent) => {
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      el.style.setProperty('--mx', `${px * 100}%`)
      el.style.setProperty('--my', `${py * 100}%`)
      ry((px - 0.5) * 10)
      rx((0.5 - py) * 10)
    }
    const onLeave = () => {
      rx(0)
      ry(0)
    }

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <div ref={ref} className={`tilt ${className}`}>
      {children}
    </div>
  )
}
