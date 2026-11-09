import DOMPurify from 'dompurify'
import { GITHUB_USER } from '../data/github'

const API = 'https://api.github.com/repos'
const cache = new Map<string, Promise<Readme>>()

function isRelative(url: string) {
  return !/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('//') && !url.startsWith('#')
}

function cleanPath(url: string) {
  return url.replace(/^\.?\//, '')
}

// El HTML del README viene de GitHub pero igual se trata como no confiable:
// se sanea, se quitan estilos y clases (chocarían con el CSS de la página y con la CSP)
// y las rutas relativas se reescriben al repo.
export function cleanReadme(html: string, repo: string): string {
  const blob = `https://github.com/${GITHUB_USER}/${repo}/blob/HEAD/`
  const raw = `https://raw.githubusercontent.com/${GITHUB_USER}/${repo}/HEAD/`

  // GitHub agrega style="max-width:100%" a las imágenes. Se quita antes de parsear:
  // DOMPurify igual lo eliminaría, pero al parsearlo el navegador reporta una violación de la CSP.
  const withoutStyles = html.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')

  const fragment = DOMPurify.sanitize(withoutStyles, {
    FORBID_TAGS: ['style', 'svg', 'form', 'input', 'button', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style'],
    RETURN_DOM_FRAGMENT: true,
  })

  fragment.querySelectorAll('a.anchor').forEach((a) => a.remove())

  fragment.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') ?? ''
    if (isRelative(src)) img.setAttribute('src', raw + cleanPath(src))
    else if (!src.startsWith('https://')) img.remove()
    img.setAttribute('loading', 'lazy')
    img.setAttribute('decoding', 'async')
    img.removeAttribute('data-canonical-src')
  })

  fragment.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') ?? ''
    if (href.startsWith('#')) return
    if (isRelative(href)) a.setAttribute('href', blob + cleanPath(href))
    else if (!/^https?:\/\//.test(href)) {
      a.removeAttribute('href')
      return
    }
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noreferrer')
  })

  fragment.querySelectorAll('[class]').forEach((el) => el.removeAttribute('class'))

  const container = document.createElement('div')
  container.append(fragment)
  return container.innerHTML
}

export interface Readme {
  html: string
  // true cuando se pidió inglés pero el repo solo tiene el README en español
  fallback: boolean
}

function requestReadme(repo: string, path: string) {
  return fetch(`${API}/${GITHUB_USER}/${encodeURIComponent(repo)}/${path}`, {
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    headers: { Accept: 'application/vnd.github.html+json' },
  }).then((res) => {
    if (!res.ok) throw new Error(`README ${res.status}`)
    return res.text()
  })
}

const readHtml = (repo: string) => (html: string) => cleanReadme(html.slice(0, 400_000), repo)

// El README principal está en español. En inglés se busca README.en.md y, si el repo no lo tiene,
// se usa el principal marcado como fallback para avisar en la página.
export function fetchReadme(repo: string, lang: 'es' | 'en' = 'es'): Promise<Readme> {
  const key = `${lang}:${repo}`
  const cached = cache.get(key)
  if (cached) return cached
  const main = () => requestReadme(repo, 'readme').then(readHtml(repo)).then((html) => ({ html, fallback: lang === 'en' }))
  const request =
    lang === 'en'
      ? requestReadme(repo, 'contents/README.en.md')
          .then(readHtml(repo))
          .then((html) => ({ html, fallback: false }), main)
      : main()
  request.catch(() => cache.delete(key))
  cache.set(key, request)
  return request
}

export interface Release {
  tag: string
  url: string
}

// Último release publicado (si hay). Se pide la lista en vez de /latest para no generar un 404.
export async function fetchLatestRelease(repo: string): Promise<Release | null> {
  try {
    const res = await fetch(`${API}/${GITHUB_USER}/${encodeURIComponent(repo)}/releases?per_page=1`, {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (!Array.isArray(data) || !data[0]) return null
    const { tag_name, html_url } = data[0] as { tag_name?: unknown; html_url?: unknown }
    if (typeof tag_name !== 'string' || typeof html_url !== 'string') return null
    if (!html_url.startsWith(`https://github.com/${GITHUB_USER}/${repo}/releases/`)) return null
    return { tag: tag_name.slice(0, 40), url: html_url }
  } catch {
    return null
  }
}
