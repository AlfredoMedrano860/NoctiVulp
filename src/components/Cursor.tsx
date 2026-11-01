import { useEffect, useRef, useState } from 'react'
import { gsap, hasFinePointer } from '../lib/motion'
import { MothLogo } from './MothLogo'

// Polilla que sigue al cursor del sistema (que nunca se oculta), con un poco de
// retraso y ladeándose según el movimiento. Los elementos con data-cursor="Texto"
// muestran ese texto a su lado.
export function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLSpanElement>(null)
  const [label, setLabel] = useState('')
  const [hovering, setHovering] = useState(false)
  const [enabled] = useState(hasFinePointer)

  useEffect(() => {
    const root = rootRef.current
    const body = bodyRef.current
    if (!enabled || !root || !body) return

    const toX = gsap.quickTo(root, 'x', { duration: 0.55, ease: 'power3' })
    const toY = gsap.quickTo(root, 'y', { duration: 0.55, ease: 'power3' })
    const tilt = gsap.quickTo(body, 'rotation', { duration: 0.5, ease: 'power2' })

    // Oculta hasta el primer movimiento, para que no aparezca en la esquina.
    let shown = false
    let lastX = 0
    let still = 0
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true
        lastX = e.clientX
        gsap.set(root, { x: e.clientX, y: e.clientY })
        gsap.to(root, { opacity: 1, duration: 0.3 })
      }
      toX(e.clientX)
      toY(e.clientY)
      tilt(gsap.utils.clamp(-28, 28, (e.clientX - lastX) * 2))
      lastX = e.clientX
      window.clearTimeout(still)
      still = window.setTimeout(() => tilt(0), 120)
    }

    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null
      const labelled = target?.closest<HTMLElement>('[data-cursor]')
      const interactive = target?.closest('a, button, [role="tab"], [role="switch"], [role="radio"]')
      setLabel(labelled?.dataset.cursor ?? '')
      setHovering(Boolean(interactive || labelled))
    }

    const onLeaveWindow = () => gsap.to(root, { opacity: 0, duration: 0.2 })
    const onEnterWindow = () => gsap.to(root, { opacity: 1, duration: 0.2 })

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerover', onOver)
    document.addEventListener('pointerleave', onLeaveWindow)
    document.addEventListener('pointerenter', onEnterWindow)
    return () => {
      window.clearTimeout(still)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerleave', onLeaveWindow)
      document.removeEventListener('pointerenter', onEnterWindow)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div ref={rootRef} className={`cursor-moth ${hovering ? 'is-hover' : ''} ${label ? 'has-label' : ''}`} aria-hidden="true">
      <span ref={bodyRef} className="cursor-moth__body">
        <MothLogo size={34} />
      </span>
      <span className="cursor-moth__label">{label}</span>
    </div>
  )
}
