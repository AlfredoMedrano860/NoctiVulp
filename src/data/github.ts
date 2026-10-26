// Validación de los datos de la API de GitHub. Sin dependencias del navegador:
// la usan tanto la app como el build (vite.config.ts) al generar las páginas estáticas.
import { categorize, type Project } from './projects.ts'

export const GITHUB_USER = 'noctivulp-ch'

export const REPOS_API = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`

const REPO_URL_PREFIX = `https://github.com/${GITHUB_USER}/`
const MAX_REPOS = 60
const MAX_DESCRIPTION = 280

// Solo los campos que se usan; así el caché y los datos embebidos pesan poco.
export interface RawRepo {
  name?: unknown
  description?: unknown
  language?: unknown
  html_url?: unknown
  stargazers_count?: unknown
  updated_at?: unknown
  license?: unknown
  archived?: unknown
  private?: unknown
}

export function slimRepo(r: RawRepo): RawRepo {
  const license = r.license && typeof r.license === 'object' ? (r.license as { spdx_id?: unknown }).spdx_id : null
  return {
    name: r.name,
    description: r.description,
    language: r.language,
    html_url: r.html_url,
    stargazers_count: r.stargazers_count,
    updated_at: r.updated_at,
    license: typeof license === 'string' ? { spdx_id: license } : null,
  }
}

// Todo lo que viene de fuera se valida: solo enlaces a repos de la cuenta,
// textos acotados y tipos correctos.
function toProject(raw: RawRepo): Project | null {
  const { name, description, language, html_url, stargazers_count, updated_at, license } = raw
  if (typeof name !== 'string' || !/^[\w.-]{1,100}$/.test(name)) return null
  if (typeof html_url !== 'string' || !html_url.startsWith(REPO_URL_PREFIX)) return null
  if (typeof updated_at !== 'string' || Number.isNaN(Date.parse(updated_at))) return null
  const spdx = license && typeof license === 'object' ? (license as { spdx_id?: unknown }).spdx_id : null
  return {
    name,
    url: html_url,
    description: typeof description === 'string' ? description.slice(0, MAX_DESCRIPTION) : '',
    language: typeof language === 'string' ? language.slice(0, 40) : null,
    license: typeof spdx === 'string' && /^[\w.+-]{1,40}$/.test(spdx) && spdx !== 'NOASSERTION' ? spdx : null,
    stars: typeof stargazers_count === 'number' && stargazers_count >= 0 ? stargazers_count : 0,
    updatedAt: updated_at,
    category: categorize(name),
  }
}

// Para embeber la lista de respaldo con la misma forma que la API.
export function projectToRaw(p: Project): RawRepo {
  return {
    name: p.name,
    description: p.description,
    language: p.language,
    html_url: p.url,
    stargazers_count: p.stars,
    updated_at: p.updatedAt,
    license: p.license ? { spdx_id: p.license } : null,
  }
}

export function sanitizeRepos(list: unknown): Project[] {
  if (!Array.isArray(list)) return []
  return list
    .filter((r: RawRepo) => r && typeof r === 'object' && r.archived !== true && r.private !== true)
    .slice(0, MAX_REPOS)
    .map((r) => toProject(r as RawRepo))
    .filter((p): p is Project => p !== null)
}
