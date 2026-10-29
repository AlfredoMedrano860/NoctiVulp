import { useEffect, useState } from 'react'
import screenshots from 'virtual:nv-screenshots'
import type { Project } from '../data/projects'
import { DICTS } from '../i18n'
import { buildProjectArt, toPreviewUrl } from '../lib/projectArt'

export interface ProjectArt {
  canvases: HTMLCanvasElement[]
  urls: string[]
}

const EMPTY: ProjectArt = { canvases: [], urls: [] }

const revoke = (url: string) => url && URL.revokeObjectURL(url)

const INTERACTION_EVENTS = ['scroll', 'wheel', 'pointerdown', 'touchstart', 'keydown'] as const

const firstInteraction = new Promise<void>((resolve) => {
  const done = () => {
    INTERACTION_EVENTS.forEach((type) => window.removeEventListener(type, done))
    window.clearTimeout(timer)
    resolve()
  }
  const timer = window.setTimeout(done, 6000)
  INTERACTION_EVENTS.forEach((type) => window.addEventListener(type, done, { passive: true, once: true }))
})

const covers = Object.fromEntries(Object.entries(screenshots).map(([name, files]) => [name, files[0]]))

export function useProjectArt(projects: Project[]): ProjectArt {
  const [art, setArt] = useState<ProjectArt>(EMPTY)

  useEffect(() => {
    if (!projects.length) return
    let cancelled = false
    ;(async () => {
      await firstInteraction
      if (cancelled) return
      // las portadas generadas llevan la categoría en español: son parte del arte, no de la interfaz
      const canvases = await buildProjectArt(projects, DICTS.es.categories, covers)
      const urls = await Promise.all(canvases.map((c) => toPreviewUrl(c)))
      if (cancelled) urls.forEach(revoke)
      else setArt({ canvases, urls })
    })()
    return () => {
      cancelled = true
    }
  }, [projects])

  // Libera las URLs de blob anteriores cuando llegan unas nuevas.
  useEffect(() => () => art.urls.forEach(revoke), [art])

  // Mientras se regeneran, no devolver portadas que no correspondan a la lista actual.
  return art.canvases.length === projects.length ? art : EMPTY
}
