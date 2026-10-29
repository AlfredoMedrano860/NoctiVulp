import { useEffect, useRef, type CSSProperties } from 'react'
import { useA11y } from '../lib/a11y'
import { hasFinePointer } from '../lib/motion'

const BAND = 132

// Banda clara que sigue al mouse y oscurece arriba y abajo.
export function ReadingGuide() {
  const { readingGuide } = useA11y()
  const ref = useRef<HTMLDivElement>(null)
  const enabled = readingGuide && hasFinePointer()

  useEffect(() => {
    const el = ref.current
    if (!enabled || !el) return
    const place = (y: number) => el.style.setProperty('--guide-y', `${y}px`)
    place(window.innerHeight / 2)
    const onMove = (e: PointerEvent) => place(e.clientY)
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [enabled])

  if (!enabled) return null
  return (
    <div ref={ref} className="reading-guide" aria-hidden="true" data-a11y-ui="" style={{ '--guide-band': `${BAND}px` } as CSSProperties}>
      <span className="reading-guide__top" />
      <span className="reading-guide__line" />
      <span className="reading-guide__bottom" />
    </div>
  )
}
