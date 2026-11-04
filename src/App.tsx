import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AccessibilityMenu } from './components/AccessibilityMenu'
import { Atmosphere } from './components/Atmosphere'
import { BackToTop } from './components/BackToTop'
import { Deferred } from './components/Deferred'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { MenuOverlay } from './components/MenuOverlay'
import { ReadingGuide } from './components/ReadingGuide'
import { ScrollProgress } from './components/ScrollProgress'
import { PAINTED_BACKGROUND } from './config'
import { useGithubRepos } from './hooks/useGithubRepos'
import { useProgressiveDone } from './hooks/useProgressiveDone'
import { useProjectArt } from './hooks/useProjectArt'
import { getDict, LangContext, loadDict, type Lang } from './i18n'
import { scrollToTarget } from './lib/motion'
import { Home } from './pages/Home'
import { useRoute } from './router'

const ProjectPage = lazy(() => import('./pages/ProjectPage').then((m) => ({ default: m.ProjectPage })))

function App() {
  const route = useRoute()
  // Al cambiar de idioma se sigue mostrando el anterior hasta que llega el diccionario nuevo.
  const [lang, setLang] = useState<Lang>(route.lang)
  const t = getDict(lang)
  const { projects, live } = useGithubRepos()
  const art = useProjectArt(projects)
  const [ready, setReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // el menú (casi un tercio de la página) se monta recién la primera vez que se abre
  const [menuMounted, setMenuMounted] = useState(false)
  const mounted = useProgressiveDone()
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const toggleMenu = () => {
    setMenuMounted(true)
    setMenuOpen((o) => !o)
  }
  const pageKey = `${lang}:${route.page}:${route.name ?? ''}`

  // La entrada del hero espera a las fuentes, para que el título se parta en líneas reales.
  useEffect(() => {
    let alive = true
    const start = () => alive && setReady(true)
    void document.fonts.ready.then(start)
    const fallback = window.setTimeout(start, 1200)
    return () => {
      alive = false
      window.clearTimeout(fallback)
    }
  }, [])

  useEffect(() => {
    if (route.lang === lang) return
    let alive = true
    void loadDict(route.lang).then(() => alive && setLang(route.lang))
    return () => {
      alive = false
    }
  }, [route.lang, lang])

  // idioma y título del documento
  useEffect(() => {
    document.documentElement.lang = lang
    if (route.page === 'home') document.title = t.meta.title
  }, [lang, route.page, t])

  // En cada navegación (cada una crea un objeto route nuevo): arriba del todo,
  // o a la sección del #hash.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (route.hash && document.getElementById(route.hash)) scrollToTarget(`#${route.hash}`)
      else scrollToTarget(0, true)
    })
    return () => cancelAnimationFrame(id)
  }, [route])

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.toggleAttribute('data-offscreen', !entry.isIntersecting)
    })
    document.querySelectorAll('section, footer').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pageKey, projects, mounted])

  return (
    <LangContext.Provider value={lang}>
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <Atmosphere vivid={route.page === 'home'} painted={PAINTED_BACKGROUND} pageKey={pageKey} mounted={mounted} />
      <ScrollProgress />
      <Header ref={menuBtnRef} open={menuOpen} onToggle={toggleMenu} route={route} />
      {menuMounted && <MenuOverlay open={menuOpen} onClose={closeMenu} lang={lang} returnFocusRef={menuBtnRef} projects={projects} />}
      <div inert={menuOpen} key={pageKey}>
        {route.page === 'project' && route.name ? (
          <Suspense fallback={null}>
            <ProjectPage name={route.name} projects={projects} art={art} />
          </Suspense>
        ) : (
          <Home projects={projects} art={art} live={live} ready={ready} />
        )}
        <Deferred>
          <Footer />
        </Deferred>
      </div>
      <BackToTop />
      <AccessibilityMenu />
      <ReadingGuide />
    </LangContext.Provider>
  )
}

export default App
