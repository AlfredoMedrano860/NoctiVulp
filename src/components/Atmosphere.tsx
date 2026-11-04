import { useEffect, useRef, useState } from 'react'
import { onScrollFrame, progressBetween } from '../lib/scroll'
import { RainCanvas } from './RainCanvas'

type Scene = 'city' | 'alley' | 'roof'
type Layer = Scene | 'crisp'

const SCENES: Scene[] = ['city', 'alley', 'roof']

// Escenas pintadas una vez con `npm run paint` (public/paint): la versión suave de cada
// una y la nítida de la ciudad, que se ve arriba del todo y se desvanece al bajar.
const sceneUrl = (scene: Scene, soft = true) => `/paint/scene-${scene}${soft ? '-soft' : ''}.webp`

interface AtmosphereProps {
  vivid: boolean
  painted: boolean
  pageKey: string
  // cambia a true cuando terminan de montarse las secciones de abajo
  mounted: boolean
}

export function Atmosphere({ vivid, painted, pageKey, mounted }: AtmosphereProps) {
  const crispRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState<Partial<Record<Layer, boolean>>>({})
  const [scene, setScene] = useState<Scene>('city')
  const markLoaded = (layer: Layer) => () => setLoaded((current) => ({ ...current, [layer]: true }))

  // La escena es la de la sección que cruza la línea del 55 % de la pantalla.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('[data-scene]:not(.atmosphere)')
    if (!sections.length) {
      // páginas sin secciones con escena (fichas de proyecto): la ciudad
      const id = requestAnimationFrame(() => setScene('city'))
      return () => cancelAnimationFrame(id)
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setScene(((entry.target as HTMLElement).dataset.scene as Scene) ?? 'city')
        }
      },
      { rootMargin: '-55% 0px -44% 0px' },
    )
    sections.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pageKey, mounted])

  // La ciudad nítida se desvanece en el primer 90 % de pantalla de scroll (solo en el inicio).
  useEffect(() => {
    const crisp = crispRef.current
    if (!crisp) return
    if (!vivid) {
      crisp.style.opacity = '0'
      return
    }
    return onScrollFrame(() => {
      crisp.style.opacity = String(1 - progressBetween(window.scrollY, 0, window.innerHeight * 0.9))
    })
  }, [vivid])

  return (
    <div className="atmosphere" data-scene={scene} aria-hidden="true">
      {painted && (
        <>
          {SCENES.map((s) => (
            <img
              key={s}
              src={sceneUrl(s)}
              alt=""
              decoding="async"
              fetchPriority={s === 'city' ? 'high' : 'low'}
              onLoad={markLoaded(s)}
              className={`atmosphere__layer atmosphere__layer--${s} ${loaded[s] ? 'is-ready' : ''}`}
            />
          ))}
          <img
            ref={crispRef}
            src={sceneUrl('city', false)}
            alt=""
            decoding="async"
            onLoad={markLoaded('crisp')}
            className={`atmosphere__layer atmosphere__layer--crisp ${loaded.crisp ? 'is-ready' : ''}`}
          />
        </>
      )}
      <div className="atmosphere__shade" />
      <RainCanvas />
    </div>
  )
}
