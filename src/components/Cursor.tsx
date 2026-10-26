import { useEffect, useRef, useState } from 'react'
import { gsap, hasFinePointer } from '../lib/motion'

// Anillo que sigue al cursor del sistema (que nunca se oculta). Los elementos con
// data-cursor="Texto" lo agrandan y muestran ese texto.
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [hovering, setHovering] = useState(false)
  const [enabled] = useState(hasFinePointer)

  useEffect(() => {
    const ring = ringRef.current
    if (!enabled || !ring) return

    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' })

    // Oculto hasta el primer movimiento, para que no aparezca en la esquina.
    let shown = false
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true
        gsap.set(ring, { x: e.clientX, y: e.clientY })
        gsap.to(ring, { opacity: 1, duration: 0.3 })
      }
      ringX(e.clientX)
      ringY(e.clientY)
    }

    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null
      const labelled = target?.closest<HTMLElement>('[data-cursor]')
      const interactive = target?.closest('a, button, [role="tab"]')
      setLabel(labelled?.dataset.cursor ?? '')
      setHovering(Boolean(interactive || labelled))
    }

    const onLeaveWindow = () => gsap.to(ring, { opacity: 0, duration: 0.2 })
    const onEnterWindow = () => gsap.to(ring, { opacity: 1, duration: 0.2 })

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerover', onOver)
    document.addEventListener('pointerleave', onLeaveWindow)
    document.addEventListener('pointerenter', onEnterWindow)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerleave', onLeaveWindow)
      document.removeEventListener('pointerenter', onEnterWindow)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      ref={ringRef}
      className={`cursor-ring ${hovering ? 'is-hover' : ''} ${label ? 'has-label' : ''}`}
      aria-hidden="true"
    >
      <span>{label}</span>
    </div>
  )
}
