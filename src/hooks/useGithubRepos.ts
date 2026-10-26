import { useEffect, useState } from 'react'
import { GITHUB_USER, REPOS_API, sanitizeRepos, slimRepo, type RawRepo } from '../data/github'
import { FALLBACK_PROJECTS, type Project } from '../data/projects'

const CACHE_KEY = `nv-repos-${GITHUB_USER}`

function readCache(): Project[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    // el caché guarda la forma de la API, así pasa por la misma validación
    const projects = sanitizeRepos(JSON.parse(raw))
    return projects.length ? projects : null
  } catch {
    return null
  }
}

// Repos que el build dejó dentro del HTML: la página arranca con datos sin esperar a la API.
function readEmbedded(): Project[] | null {
  try {
    const raw = document.getElementById('nv-data')?.textContent
    if (!raw) return null
    const projects = sanitizeRepos(JSON.parse(raw))
    return projects.length ? projects : null
  } catch {
    return null
  }
}

function writeCache(repos: RawRepo[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(repos))
  } catch {
    // sin almacenamiento disponible: no pasa nada
  }
}

export function useGithubRepos() {
  const [cached] = useState(readCache)
  const [projects, setProjects] = useState<Project[]>(() => cached ?? readEmbedded() ?? [])
  const [live, setLive] = useState(Boolean(cached))

  useEffect(() => {
    if (cached) return
    const controller = new AbortController()
    // si tarda más de 8 s se usa lo que haya (datos embebidos o la lista de respaldo)
    const timeout = window.setTimeout(() => controller.abort(), 8000)
    let unmounted = false

    fetch(REPOS_API, {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub ${res.status}`)
        return res.json() as Promise<unknown>
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Respuesta inesperada')
        const slim = (data as RawRepo[]).filter((r) => r && typeof r === 'object').map(slimRepo)
        const mapped = sanitizeRepos(data)
        if (!mapped.length) throw new Error('Sin repos válidos')
        setProjects(mapped)
        setLive(true)
        writeCache(slim)
      })
      .catch(() => {
        if (unmounted) return
        setProjects((current) => (current.length ? current : FALLBACK_PROJECTS))
        setLive(false)
      })
      .finally(() => window.clearTimeout(timeout))

    return () => {
      unmounted = true
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [cached])

  return { projects, live }
}
