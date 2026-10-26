import { useCallback, useEffect, useRef, useState } from 'react'
import { Cursor } from './components/Cursor'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { MenuOverlay } from './components/MenuOverlay'
import { Preloader } from './components/Preloader'
import { ScrollProgress } from './components/ScrollProgress'
import { useGithubRepos } from './hooks/useGithubRepos'
import { useProjectArt } from './hooks/useProjectArt'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { DICTS, LangContext } from './i18n'
import { scrollToTarget, ScrollTrigger } from './lib/motion'
import { Home } from './pages/Home'
import { ProjectPage } from './pages/ProjectPage'
import { useRoute } from './router'

function App() {
  useSmoothScroll()
  const route = useRoute()
  const t = DICTS[route.lang]
  const { projects, live } = useGithubRepos()
  const art = useProjectArt(projects)
  const [ready, setReady] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  const onLoaded = useCallback(() => setReady(true), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const pageKey = `${route.lang}:${route.page}:${route.name ?? ''}`

  // idioma y título del documento
  useEffect(() => {
    document.documentElement.lang = route.lang
    if (route.page === 'home') document.title = t.meta.title
  }, [route.lang, route.page, t])

  // En cada navegación (cada una crea un objeto route nuevo): arriba del todo,
  // o a la sección del #hash.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      if (route.hash && document.getElementById(route.hash)) scrollToTarget(`#${route.hash}`)
      else scrollToTarget(0, true)
    })
    return () => cancelAnimationFrame(id)
  }, [route])

  // Las alturas cambian cuando llegan los repos: recalcular los triggers.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [projects, art])

  return (
    <LangContext.Provider value={route.lang}>
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <Preloader onDone={onLoaded} />
      <Cursor />
      <ScrollProgress />
      <Header ref={menuBtnRef} open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} route={route} />
      <MenuOverlay open={menuOpen} onClose={closeMenu} lang={route.lang} returnFocusRef={menuBtnRef} />
      <div inert={menuOpen} key={pageKey}>
        {route.page === 'project' && route.name ? (
          <ProjectPage name={route.name} projects={projects} art={art} />
        ) : (
          <Home projects={projects} art={art} live={live} ready={ready} />
        )}
        <Footer />
      </div>
    </LangContext.Provider>
  )
}

export default App
