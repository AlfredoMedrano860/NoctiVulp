import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Project } from '../data/projects'
import type { ProjectArt } from '../hooks/useProjectArt'
import { useLang, useT } from '../i18n'
import { scrollToTarget, ScrollTrigger, useGSAP } from '../lib/motion'
import { projectPath } from '../router'
import { ArrowIcon, GithubIcon } from './Icons'
import { Link } from './Link'
import { Magnetic } from './Magnetic'
import { RollingText } from './RollingText'
import type { Category } from '../data/projects'
import type { ArtKind } from '../lib/paint/sizes'
import { MothLayer } from './MothLayer'
import { PaintedArt } from './PaintedArt'

const CATEGORY_ART: Record<Category, ArtKind> = { linux: 'laptop', gaming: 'gamepad', apps: 'window', design: 'palette' }

// Three.js pesa bastante: se carga aparte, cuando hace falta.
const WorkCanvas = lazy(() => import('./WorkCanvas').then((m) => ({ default: m.WorkCanvas })))

const pad = (n: number) => String(n).padStart(2, '0')

// Alto de scroll por proyecto (en vh). Más bajo = se recorre más rápido.
const VH_PER_PROJECT = 70

interface WorkShowcaseProps {
  projects: Project[]
  art: ProjectArt
  live: boolean
}

// Sección fija: al hacer scroll se avanza proyecto por proyecto.
export function WorkShowcase({ projects, art, live }: WorkShowcaseProps) {
  const t = useT()
  const lang = useLang()
  const sectionRef = useRef<HTMLElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const [view, setView] = useState({ index: 0, dir: 1 })
  const count = projects.length
  const dateFormat = new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' })
  const activeRef = useRef(0)
  const busyUntilRef = useRef(0)

  const projectCenter = useCallback(
    (i: number) => {
      const section = sectionRef.current
      if (!section || !count) return 0
      const range = section.offsetHeight - window.innerHeight
      return section.offsetTop + ((i + 0.5) / count) * range
    },
    [count],
  )

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section || !count) return
      const indexAt = (progress: number) => Math.min(count - 1, Math.floor(progress * count))
      const busy = () => performance.now() < busyUntilRef.current
      let lastInput = -Infinity

      const goTo = (i: number, duration = 0.8) => {
        activeRef.current = i
        busyUntilRef.current = performance.now() + duration * 1000 + 80
        scrollToTarget(projectCenter(i), false, duration)
      }
      // Si se entra a la sección con inercia, se frena en el primer (o último) proyecto.
      const catchMomentum = (i: number) => {
        if (!busy() && performance.now() - lastInput < 1200) goTo(i, 0.6)
      }

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onEnter: () => catchMomentum(0),
        onEnterBack: () => catchMomentum(count - 1),
        onUpdate: (self) => {
          const i = indexAt(self.progress)
          if (!busy()) activeRef.current = i
          if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`
          setView((prev) => (prev.index === i ? prev : { index: i, dir: i > prev.index ? 1 : -1 }))
        },
      })

      const leaving = (dir: number) => (dir < 0 && activeRef.current === 0) || (dir > 0 && activeRef.current === count - 1)

      // Rueda: un gesto (hasta que la rueda se detiene) = un proyecto.
      let lastWheel = -Infinity
      let released = false
      const onWheel = (e: WheelEvent) => {
        if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return
        const now = performance.now()
        const newGesture = now - lastWheel > 180
        lastWheel = now
        lastInput = now
        const dir = e.deltaY > 0 ? 1 : -1
        if (newGesture) released = trigger.isActive && !busy() && leaving(dir)
        if (released || !trigger.isActive) return
        e.preventDefault()
        e.stopPropagation()
        if (newGesture && !busy()) goTo(activeRef.current + dir)
      }

      // Táctil: se bloquea el scroll nativo y se avanza un proyecto al soltar.
      let touchY = 0
      let touchHeld = false
      const onTouchStart = (e: TouchEvent) => {
        touchY = e.touches[0].clientY
        touchHeld = false
      }
      const onTouchMove = (e: TouchEvent) => {
        lastInput = performance.now()
        if (!trigger.isActive || e.touches.length > 1) return
        const dy = touchY - e.touches[0].clientY
        if (!touchHeld && (Math.abs(dy) < 6 || (!busy() && leaving(Math.sign(dy))))) return
        touchHeld = true
        if (e.cancelable) e.preventDefault()
      }
      const onTouchEnd = (e: TouchEvent) => {
        lastInput = performance.now()
        if (!touchHeld) return
        touchHeld = false
        const dy = touchY - e.changedTouches[0].clientY
        if (Math.abs(dy) <= 40 || busy()) return
        const target = Math.max(0, Math.min(count - 1, activeRef.current + Math.sign(dy)))
        // Lenis frena su animación en cada evento táctil: el salto se lanza después.
        busyUntilRef.current = performance.now() + 900
        setTimeout(() => goTo(target), 0)
      }

      const opts = { capture: true, passive: false }
      window.addEventListener('wheel', onWheel, opts)
      window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true })
      window.addEventListener('touchmove', onTouchMove, opts)
      window.addEventListener('touchend', onTouchEnd, { capture: true, passive: true })
      return () => {
        window.removeEventListener('wheel', onWheel, opts)
        window.removeEventListener('touchstart', onTouchStart, { capture: true })
        window.removeEventListener('touchmove', onTouchMove, opts)
        window.removeEventListener('touchend', onTouchEnd, { capture: true })
      }
    },
    { dependencies: [count, projectCenter], scope: sectionRef },
  )

  const jumpTo = useCallback(
    (i: number) => {
      if (!count) return
      const target = Math.max(0, Math.min(count - 1, i))
      activeRef.current = target
      busyUntilRef.current = performance.now() + 1500
      scrollToTarget(projectCenter(target))
    },
    [count, projectCenter],
  )

  // Flechas ← → (o J / K) para pasar de proyecto mientras la sección está en pantalla.
  const indexRef = useRef(0)
  useEffect(() => {
    indexRef.current = view.index
  }, [view.index])
  useEffect(() => {
    const section = sectionRef.current
    if (!section || !count) return
    let inView = false
    const io = new IntersectionObserver(([entry]) => (inView = entry.intersectionRatio > 0.5), { threshold: [0, 0.5, 1] })
    io.observe(section.querySelector('.work__sticky') ?? section)
    const onKey = (e: KeyboardEvent) => {
      if (!inView || e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable]')) return
      if (e.key === 'ArrowRight' || e.key === 'j') jumpTo(indexRef.current + 1)
      else if (e.key === 'ArrowLeft' || e.key === 'k') jumpTo(indexRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      io.disconnect()
      window.removeEventListener('keydown', onKey)
    }
  }, [count, jumpTo])

  // En una columna, el cuadro usa el alto que sobra para no montarse sobre el texto.
  const layoutRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const layout = layoutRef.current
    if (!layout) return
    const parts = ['.work__top', '.work__info', '.work__nav'].map((s) => layout.querySelector<HTMLElement>(s))
    const fit = () => {
      const cs = getComputedStyle(layout)
      const used = parts.reduce((sum, el) => sum + (el?.offsetHeight ?? 0), 0) + 3 * parseFloat(cs.rowGap)
      const free = layout.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - used
      layout.style.setProperty('--media-fit', `${Math.max(120, Math.floor(free))}px`)
    }
    const ro = new ResizeObserver(fit)
    ro.observe(layout)
    parts.forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [count])

  const [canvasReady, setCanvasReady] = useState(false)
  useEffect(() => {
    const section = sectionRef.current
    if (!section || canvasReady) return
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setCanvasReady(true), { rootMargin: '0px 0px 150px 0px' })
    io.observe(section)
    return () => io.disconnect()
  }, [canvasReady])

  const project = projects[view.index]
  const detail = project ? projectPath(lang, project.name) : '#'
  const fallbackCover = art.urls[view.index] && <img className="work-canvas" src={art.urls[view.index]} alt="" />

  // Las estrellas solo se muestran si hay; si no, la licencia.
  const thirdMeta = project
    ? project.stars > 0
      ? { label: t.work.stars, value: String(project.stars) }
      : project.license
        ? { label: t.work.license, value: project.license }
        : null
    : null

  return (
    <section
      id="proyectos"
      data-scene="city"
      ref={sectionRef}
      className="work"
      style={{ height: count ? `${count * VH_PER_PROJECT + 100}vh` : '100vh' }}
    >
      <div className="work__sticky">
        <MothLayer positions={[{ top: '14%', left: '52%' }, { top: '78%', left: '38%' }, { top: '30%', left: '4%' }]} />
        <div className="container work__layout" ref={layoutRef}>
          <header className="work__top">
            <p className="eyebrow">
              <span className={`dot ${live ? 'dot--live' : ''}`} />
              {t.work.eyebrow} · {live ? t.work.live : t.work.offline}
            </p>
            {count > 0 && (
              <p className="work__counter">
                <RollingText text={pad(view.index + 1)} direction={view.dir} />
                <span>/ {pad(count)}</span>
              </p>
            )}
          </header>

          {project ? (
            <>
              <Link to={detail} className="work__media" data-cursor={t.work.cursor} aria-label={`${t.work.viewProject}: ${project.name}`}>
                {canvasReady ? (
                  <Suspense fallback={fallbackCover}>
                    <WorkCanvas arts={art.canvases} fallbackUrls={art.urls} index={view.index} />
                  </Suspense>
                ) : (
                  fallbackCover
                )}
                <span className="work__badges" aria-hidden="true">
                  {(Object.keys(CATEGORY_ART) as Category[]).map((category) => (
                    <PaintedArt
                      key={category}
                      kind={CATEGORY_ART[category]}
                      className={`work__badge ${category === project.category ? 'is-active' : ''}`}
                    />
                  ))}
                </span>
              </Link>

              <div className="work__info">
                <span className="tag">
                  <RollingText text={t.categories[project.category]} direction={view.dir} />
                </span>
                <h2 className="work__title" style={{ '--name-length': project.name.length } as CSSProperties}>
                  <RollingText text={project.name} direction={view.dir} />
                </h2>
                <p className="work__desc">
                  <RollingText text={project.description || t.project.noDescription} direction={view.dir} delay={0.06} />
                </p>
                <dl className="work__meta">
                  <div>
                    <dt>{t.work.language}</dt>
                    <dd>
                      <RollingText text={project.language ?? '—'} direction={view.dir} delay={0.1} />
                    </dd>
                  </div>
                  {thirdMeta && (
                    <div>
                      <dt>{thirdMeta.label}</dt>
                      <dd>
                        <RollingText text={thirdMeta.value} direction={view.dir} delay={0.14} />
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>{t.work.updated}</dt>
                    <dd>
                      <RollingText text={dateFormat.format(new Date(project.updatedAt))} direction={view.dir} delay={0.18} />
                    </dd>
                  </div>
                </dl>
                <div className="work__actions">
                  <Magnetic>
                    <Link to={detail} className="btn btn--primary">
                      {t.work.viewProject} <ArrowIcon />
                    </Link>
                  </Magnetic>
                  <a href={project.url} target="_blank" rel="noreferrer" className="btn btn--ghost" aria-label={`${project.name} · GitHub`}>
                    <GithubIcon />
                  </a>
                </div>
              </div>

              <nav className="work__nav" aria-label={t.work.navLabel}>
                {projects.map((p, i) => (
                  <button
                    key={p.name}
                    className={`work__nav-item ${i === view.index ? 'is-active' : ''}`}
                    onClick={() => jumpTo(i)}
                    aria-label={`${pad(i + 1)} · ${p.name}`}
                    aria-current={i === view.index ? 'true' : undefined}
                    data-cursor={p.name}
                  >
                    {pad(i + 1)}
                  </button>
                ))}
                <span className="work__keys" aria-hidden="true">
                  ← →
                </span>
              </nav>
              <div className="work__progress" aria-hidden="true">
                <span ref={progressRef} />
              </div>
            </>
          ) : (
            <div className="work__loading">
              <span className="pulse" /> {t.work.loading}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
