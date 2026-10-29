import preact from '@preact/preset-vite'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { projectToRaw, REPOS_API, sanitizeRepos, slimRepo, type RawRepo } from './src/data/github.ts'
import { FALLBACK_PROJECTS, type Project } from './src/data/projects.ts'
import { DICTS, LANGS, type Lang } from './src/i18n.ts'

// ---------------------------------------------------------------------------
// Seguridad
// ---------------------------------------------------------------------------

// Content Security Policy: recursos del propio sitio, la API de GitHub y las imágenes
// de los README (servidas por GitHub). Sin scripts ni estilos inline.
function buildCsp(analyticsOrigin?: string) {
  return [
    "default-src 'self'",
    `script-src 'self'${analyticsOrigin ? ` ${analyticsOrigin}` : ''}`,
    "style-src 'self'",
    "img-src 'self' data: blob: https://github.com https://*.githubusercontent.com",
    "font-src 'self' data:",
    `connect-src 'self' https://api.github.com${analyticsOrigin ? ` ${analyticsOrigin}` : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-src 'none'",
    "worker-src 'self'",
  ].join('; ')
}

function buildHeaders(csp: string): Record<string, string> {
  return {
    // frame-ancestors solo funciona como cabecera, no en <meta>
    'Content-Security-Policy': `${csp}; frame-ancestors 'none'`,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }
}

// ---------------------------------------------------------------------------
// Capturas de los proyectos: public/projects/<repo>/*.webp o public/projects/<repo>.webp
// ---------------------------------------------------------------------------

const SCREENSHOTS_DIR = join(process.cwd(), 'public', 'projects')
const IMAGE_RE = /\.(webp|avif|png|jpe?g)$/i

function readScreenshots(): Record<string, string[]> {
  if (!existsSync(SCREENSHOTS_DIR)) return {}
  const map: Record<string, string[]> = {}
  for (const entry of readdirSync(SCREENSHOTS_DIR).sort()) {
    const full = join(SCREENSHOTS_DIR, entry)
    if (statSync(full).isDirectory()) {
      const files = readdirSync(full).filter((f) => IMAGE_RE.test(f)).sort()
      if (files.length) map[entry.toLowerCase()] = files.map((f) => `/projects/${entry}/${f}`)
    } else if (IMAGE_RE.test(entry)) {
      const name = entry.replace(IMAGE_RE, '').toLowerCase()
      map[name] = [`/projects/${entry}`, ...(map[name] ?? [])]
    }
  }
  return map
}

function screenshotsPlugin(): Plugin {
  const id = 'virtual:nv-screenshots'
  const resolved = '\0' + id
  return {
    name: 'noctivulp-screenshots',
    resolveId: (source) => (source === id ? resolved : undefined),
    load: (source) => (source === resolved ? `export default ${JSON.stringify(readScreenshots())}` : undefined),
    configureServer(server) {
      // al agregar o quitar capturas en dev, recargar
      server.watcher.add(SCREENSHOTS_DIR)
      const reload = (file: string) => {
        if (!file.startsWith(SCREENSHOTS_DIR)) return
        const mod = server.moduleGraph.getModuleById(resolved)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
    },
  }
}

// ---------------------------------------------------------------------------
// Páginas estáticas: una por idioma y por proyecto, con su SEO y los datos embebidos
// ---------------------------------------------------------------------------

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// JSON dentro de <script>: sin "<" para que nunca pueda cerrar la etiqueta
const safeJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')

const homePath = (lang: Lang) => (lang === 'en' ? '/en/' : '/')
const projectPath = (lang: Lang, name: string) => `${lang === 'en' ? '/en' : ''}/p/${encodeURIComponent(name)}/`

async function fetchRepos(): Promise<{ raw: RawRepo[]; projects: Project[]; live: boolean }> {
  try {
    const res = await fetch(REPOS_API, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'noctivulp-build' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`GitHub ${res.status}`)
    const data = (await res.json()) as RawRepo[]
    const projects = sanitizeRepos(data)
    if (!projects.length) throw new Error('sin repos')
    const raw = data.filter((r) => r.archived !== true && r.private !== true).map(slimRepo)
    return { raw, projects, live: true }
  } catch {
    return { raw: FALLBACK_PROJECTS.map(projectToRaw), projects: FALLBACK_PROJECTS, live: false }
  }
}

interface PageInfo {
  lang: Lang
  path: string
  alternates: Record<Lang, string>
  title: string
  description: string
  image: string
  body: string
  jsonLd: object
}

function renderPage(template: string, page: PageInfo, site: string, rawRepos: RawRepo[]) {
  const url = site + page.path
  const head = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="NoctiVulp" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(site + page.image)}" />`,
    `<meta property="og:locale" content="${DICTS[page.lang].meta.locale}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(site + page.alternates[l])}" />`),
    `<link rel="alternate" hreflang="x-default" href="${esc(site + page.alternates.es)}" />`,
    `<script type="application/ld+json">${safeJson(page.jsonLd)}</script>`,
    `<script type="application/json" id="nv-data">${safeJson(rawRepos)}</script>`,
  ].join('\n    ')

  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${page.lang}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(page.description)}" />`)
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${page.body}</div>`)
}

// Contenido en HTML plano: lo que leen buscadores y quien navega sin JavaScript.
// React lo reemplaza al arrancar.
function homeBody(lang: Lang, projects: Project[]) {
  const t = DICTS[lang]
  const items = projects
    .map((p) => `<li><a href="${projectPath(lang, p.name)}">${esc(p.name)}</a> · ${esc(p.description || t.project.noDescription)}</li>`)
    .join('')
  return `<div class="ssr"><p class="ssr__brand">NoctiVulp</p><h1>${esc(t.hero.title.join(''))}</h1><p>${esc(t.hero.lead)}</p><h2>${esc(t.work.eyebrow)}</h2><ul>${items}</ul></div>`
}

function projectBody(lang: Lang, p: Project) {
  const t = DICTS[lang]
  return `<div class="ssr"><p class="ssr__brand"><a href="${homePath(lang)}">NoctiVulp</a></p><h1>${esc(p.name)}</h1><p>${esc(p.description || t.project.noDescription)}</p><p>${esc(t.categories[p.category])}${p.language ? ` · ${esc(p.language)}` : ''}${p.license ? ` · ${esc(p.license)}` : ''}</p><p><a href="${esc(p.url)}">${esc(t.project.github)}</a></p></div>`
}

function staticPagesPlugin(site: string, analytics?: { src: string; id: string }): Plugin {
  return {
    name: 'noctivulp-static-pages',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml() {
      const csp = buildCsp(analytics ? new URL(analytics.src).origin : undefined)
      return [
        { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
        ...(analytics
          ? [{ tag: 'script', attrs: { defer: true, src: analytics.src, 'data-website-id': analytics.id }, injectTo: 'head' as const }]
          : []),
      ]
    },
    async generateBundle(_options, bundle) {
      const html = bundle['index.html']
      if (!html || html.type !== 'asset') return
      const template = String(html.source)
      const { raw, projects, live } = await fetchRepos()
      if (!live) this.warn('No se pudo consultar GitHub: las páginas estáticas usan la lista de respaldo.')
      const shots = readScreenshots()
      const emit = (fileName: string, source: string) => this.emitFile({ type: 'asset', fileName, source })
      const urls: string[] = []

      for (const lang of LANGS) {
        const t = DICTS[lang]
        const page: PageInfo = {
          lang,
          path: homePath(lang),
          alternates: { es: homePath('es'), en: homePath('en') },
          title: t.meta.title,
          description: t.meta.description,
          image: '/og.png',
          body: homeBody(lang, projects),
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'NoctiVulp',
            url: site + homePath(lang),
            inLanguage: lang,
            description: t.meta.description,
          },
        }
        const out = renderPage(template, page, site, raw)
        if (lang === 'es') {
          html.source = out
          emit('404.html', out)
        } else emit('en/index.html', out)
        urls.push(page.path)

        for (const p of projects) {
          const path = projectPath(lang, p.name)
          const description = p.description || t.project.noDescription
          emit(
            `${path.slice(1)}index.html`,
            renderPage(
              template,
              {
                lang,
                path,
                alternates: { es: projectPath('es', p.name), en: projectPath('en', p.name) },
                title: `${p.name} · NoctiVulp`,
                description,
                image: shots[p.name.toLowerCase()]?.[0] ?? '/og.png',
                body: projectBody(lang, p),
                jsonLd: {
                  '@context': 'https://schema.org',
                  '@type': 'SoftwareSourceCode',
                  name: p.name,
                  description,
                  codeRepository: p.url,
                  programmingLanguage: p.language ?? undefined,
                  license: p.license ? `https://spdx.org/licenses/${p.license}.html` : undefined,
                  dateModified: p.updatedAt,
                  author: { '@type': 'Person', name: 'NoctiVulp', url: site + homePath(lang) },
                },
              },
              site,
              raw,
            ),
          )
          urls.push(path)
        }
      }

      const today = new Date().toISOString().slice(0, 10)
      emit(
        'sitemap.xml',
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${esc(site + u)}</loc><lastmod>${today}</lastmod></url>`)
          .join('\n')}\n</urlset>\n`,
      )
      emit('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`)

      const headers = buildHeaders(buildCsp(analytics ? new URL(analytics.src).origin : undefined))
      emit('_headers', `/*\n${Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const site = (env.SITE_URL || 'https://noctivulp.pages.dev').replace(/\/$/, '')
  const analytics = env.UMAMI_SRC && env.UMAMI_WEBSITE_ID ? { src: env.UMAMI_SRC, id: env.UMAMI_WEBSITE_ID } : undefined
  const headers = buildHeaders(buildCsp(analytics ? new URL(analytics.src).origin : undefined))

  return {
    plugins: [preact(), screenshotsPlugin(), staticPagesPlugin(site, analytics)],
    // `npm run preview` sirve la build con las mismas cabeceras que producción
    preview: { headers },
  }
})
