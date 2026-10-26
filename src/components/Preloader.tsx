import { useRef } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../lib/motion'
import { MothLogo } from './MothLogo'

// Solo la primera visita de la sesión ve la pantalla de carga. Se lee una vez al
// cargar el módulo (en un efecto, el doble montaje de StrictMode lo daría por visto).
const FIRST_VISIT = (() => {
  try {
    const seen = sessionStorage.getItem('nv-intro-seen') === '1'
    sessionStorage.setItem('nv-intro-seen', '1')
    return !seen
  } catch {
    return true
  }
})()

// Pantalla de carga: contador 000→100 y telón que sube.
export function Preloader({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      if (!FIRST_VISIT || prefersReducedMotion()) {
        root.style.display = 'none'
        onDone()
        return
      }

      const counter = { v: 0 }
      const tl = gsap.timeline({ paused: true })
      tl.from('.loader__moth', { scale: 0.6, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' })
        .to(
          counter,
          {
            v: 100,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => {
              if (countRef.current) countRef.current.textContent = String(Math.round(counter.v)).padStart(3, '0')
            },
          },
          0,
        )
        .to('.loader__bar span', { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
        .to('.loader__content', { yPercent: -40, opacity: 0, duration: 0.6, ease: 'power3.in' })
        .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, '-=0.15')
        .call(() => onDone(), [], '-=0.6')
        .set(root, { display: 'none' })

      document.fonts.ready.then(() => tl.play())
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef} className="loader" aria-hidden="true">
      <div className="loader__content">
        <MothLogo size={96} animated className="loader__moth" />
        <span ref={countRef} className="loader__count">
          000
        </span>
        <div className="loader__bar">
          <span />
        </div>
      </div>
    </div>
  )
}
