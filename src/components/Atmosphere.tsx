import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/motion'
import { paintSceneBlobs } from '../lib/paint/paintClient'
import { readScenes, storeScenes } from '../lib/paint/sceneCache'
import type { Scene } from '../lib/paint/scenes'
import { RainCanvas } from './RainCanvas'

const SCENES: Scene[] = ['city', 'alley', 'roof']

interface AtmosphereProps {
  vivid: boolean
  painted: boolean
  pageKey: string
}

export function Atmosphere({ vivid, painted, pageKey }: AtmosphereProps) {
  const crispRef = useRef<HTMLImageElement>(null)
  const [layers, setLayers] = useState<Partial<Record<Scene, string>>>({})
  const [crispUrl, setCrispUrl] = useState<string>()
  const [scene, setScene] = useState<Scene>('city')

  useEffect(() => {
    if (!painted) return
    let cancelled = false
    ;(async () => {
      for (const s of SCENES) {
        const keys = s === 'city' ? ['city-soft', 'city'] : [`${s}-soft`]
        let blobs = await readScenes(keys)
        if (!blobs) {
          blobs = await paintSceneBlobs(s)
          if (!blobs || cancelled) return
          void storeScenes(keys, blobs)
        }
        if (cancelled) return
        const [softUrl, crisp] = blobs.map((blob) => URL.createObjectURL(blob))
        setLayers((current) => ({ ...current, [s]: softUrl }))
        if (crisp) setCrispUrl(crisp)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [painted])

  useEffect(() => {
    let triggers: ScrollTrigger[] = []
    const id = requestAnimationFrame(() => {
      const sections = document.querySelectorAll<HTMLElement>('[data-scene]')
      if (!sections.length) setScene('city')
      triggers = Array.from(sections).map((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => {
            if (self.isActive) setScene((el.dataset.scene as Scene) ?? 'city')
          },
        }),
      )
    })
    return () => {
      cancelAnimationFrame(id)
      triggers.forEach((t) => t.kill())
    }
  }, [pageKey])

  useGSAP(
    () => {
      const crisp = crispRef.current
      if (!crisp) return
      if (!vivid) {
        gsap.set(crisp, { opacity: 0 })
        return
      }
      gsap.fromTo(
        crisp,
        { opacity: 1 },
        { opacity: 0, ease: 'none', scrollTrigger: { start: 0, end: () => window.innerHeight * 0.9, scrub: true } },
      )
    },
    { dependencies: [vivid], revertOnUpdate: true },
  )

  return (
    <div className="atmosphere" data-scene={scene} aria-hidden="true">
      {painted && (
        <>
          {SCENES.map((s) => (
            <img
              key={s}
              src={layers[s]}
              alt=""
              decoding="async"
              className={`atmosphere__layer atmosphere__layer--${s} ${layers[s] ? 'is-ready' : ''}`}
            />
          ))}
          <img
            ref={crispRef}
            src={crispUrl}
            alt=""
            decoding="async"
            className={`atmosphere__layer atmosphere__layer--crisp ${crispUrl ? 'is-ready' : ''}`}
          />
        </>
      )}
      <div className="atmosphere__shade" />
      <RainCanvas />
    </div>
  )
}
