import { useEffect, useState } from 'react'
import screenshots from 'virtual:nv-screenshots'
import type { Project } from '../data/projects'
import { CATEGORY_LABELS_ES } from '../locales/categories-es'
import { buildProjectArtUrls } from '../lib/projectArt'

// Primer momento libre después de cargar la página.
const afterLoad = () =>
  new Promise<void>((resolve) => {
    const idle = () =>
      typeof requestIdleCallback === 'function' ? requestIdleCallback(() => resolve(), { timeout: 1500 }) : setTimeout(resolve, 300)
    if (document.readyState === 'complete') idle()
    else window.addEventListener('load', idle, { once: true })
  })

export interface ProjectArt {
  urls: string[]
}

const EMPTY: ProjectArt = { urls: [] }

const revoke = (url: string) => url.startsWith('blob:') && URL.revokeObjectURL(url)

const covers = Object.fromEntries(Object.entries(screenshots).map(([name, files]) => [name, files[0]]))

export function useProjectArt(projects: Project[]): ProjectArt {
  const [art, setArt] = useState<ProjectArt>(EMPTY)

  useEffect(() => {
    if (!projects.length) return
    let cancelled = false
    ;(async () => {
      // las portadas se pintan en un worker: basta con no competir con la primera pintura
      await afterLoad()
      if (cancelled) return
      // las portadas generadas llevan la categoría en español: son parte del arte, no de la interfaz
      const urls = await buildProjectArtUrls(projects, CATEGORY_LABELS_ES, covers)
      if (cancelled) urls.forEach(revoke)
      else setArt({ urls })
    })()
    return () => {
      cancelled = true
    }
  }, [projects])

  // Libera las URLs de blob anteriores cuando llegan unas nuevas.
  useEffect(() => () => art.urls.forEach(revoke), [art])

  // Mientras se regeneran, no devolver portadas que no correspondan a la lista actual.
  return art.urls.length === projects.length ? art : EMPTY
}
