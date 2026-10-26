import { useEffect, useState, type MouseEvent } from 'react'
import type { Lang } from './i18n'

// Router mínimo: "/" y "/p/<repo>/", con el prefijo "/en" para inglés.
export interface Route {
  lang: Lang
  page: 'home' | 'project'
  name?: string
  hash: string
}

export function parseLocation(pathname: string, hash = ''): Route {
  const parts = pathname.split('/').filter(Boolean)
  let lang: Lang = 'es'
  if (parts[0] === 'en') {
    lang = 'en'
    parts.shift()
  }
  if (parts[0] === 'p' && parts[1]) {
    let name = parts[1]
    try {
      name = decodeURIComponent(name)
    } catch {
      // nombre mal codificado: se usa tal cual y no va a coincidir con ningún repo
    }
    return { lang, page: 'project', name, hash }
  }
  return { lang, page: 'home', hash }
}

export function homePath(lang: Lang, section?: string) {
  return `${lang === 'en' ? '/en/' : '/'}${section ? `#${section}` : ''}`
}

export function projectPath(lang: Lang, name: string) {
  return `${lang === 'en' ? '/en' : ''}/p/${encodeURIComponent(name)}/`
}

// Misma página en el otro idioma.
export function switchLangPath(route: Route, lang: Lang) {
  return route.page === 'project' && route.name ? projectPath(lang, route.name) : homePath(lang)
}

const EVENT = 'nv:navigate'

export function navigate(to: string) {
  const url = new URL(to, window.location.href)
  if (url.origin !== window.location.origin) {
    window.location.href = to
    return
  }
  window.history.pushState({}, '', url.pathname + url.search + url.hash)
  window.dispatchEvent(new Event(EVENT))
}

// Para los onClick de los <a>: navega sin recargar salvo que se abra en otra pestaña.
export function handleLinkClick(e: MouseEvent<HTMLAnchorElement>, to: string) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  navigate(to)
}

export function useRoute(): Route {
  const read = () => parseLocation(window.location.pathname, window.location.hash.slice(1))
  const [route, setRoute] = useState<Route>(read)

  useEffect(() => {
    const update = () => setRoute(read())
    window.addEventListener('popstate', update)
    window.addEventListener(EVENT, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(EVENT, update)
    }
  }, [])

  return route
}
