import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type TouchEvent } from 'react'
import type { Project } from '../data/projects'
import type { ProjectArt } from '../hooks/useProjectArt'
import { useLang, useT } from '../i18n'
import { projectPath } from '../router'
import { ArrowIcon, GithubIcon, LineIcon } from './Icons'
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

interface WorkShowcaseProps {
  projects: Project[]
  art: ProjectArt
  live: boolean
}

// Carrusel de proyectos: botones, flechas del teclado y deslizar de lado en táctil.
export function WorkShowcase({ projects, art, live }: WorkShowcaseProps) {
  const t = useT()
  const lang = useLang()
  const sectionRef = useRef<HTMLElement>(null)
  const [view, setView] = useState({ index: 0, dir: 1 })
  const count = projects.length
  const dateFormat = new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' })

  const goTo = useCallback(
    (i: number, dir?: number) => {
      if (!count) return
      const index = (i + count) % count
      setView((prev) => (prev.index === index ? prev : { index, dir: dir ?? (index > prev.index ? 1 : -1) }))
    },
    [count],
  )
  const step = useCallback((dir: number) => goTo(view.index + dir, dir), [goTo, view.index])

  // Flechas ← → (o J / K) mientras la sección está en pantalla.
  useEffect(() => {
    const section = sectionRef.current
    if (!section || !count) return
    let inView = false
    const io = new IntersectionObserver(([entry]) => (inView = entry.intersectionRatio > 0.5), { threshold: [0, 0.5, 1] })
    io.observe(section)
    const onKey = (e: KeyboardEvent) => {
      if (!inView || e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable]')) return
      if (e.key === 'ArrowRight' || e.key === 'j') step(1)
      else if (e.key === 'ArrowLeft' || e.key === 'k') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      io.disconnect()
      window.removeEventListener('keydown', onKey)
    }
  }, [count, step])

  // Deslizar de lado cambia de proyecto; el scroll vertical sigue siendo el normal.
  const touchRef = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    touchRef.current = e.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
  }
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchRef.current
    touchRef.current = null
    if (!start) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1)
  }

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
      aria-roledescription="carousel"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="work__frame">
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
                    onClick={() => goTo(i)}
                    aria-label={`${pad(i + 1)} · ${p.name}`}
                    aria-current={i === view.index ? 'true' : undefined}
                    data-cursor={p.name}
                  >
                    {pad(i + 1)}
                  </button>
                ))}
                <span className="work__arrows">
                  <button type="button" className="work__arrow" onClick={() => step(-1)} aria-label={t.project.prev}>
                    <LineIcon name="left" size={18} />
                  </button>
                  <button type="button" className="work__arrow" onClick={() => step(1)} aria-label={t.project.next}>
                    <LineIcon name="right" size={18} />
                  </button>
                </span>
              </nav>
              <div className="work__progress" aria-hidden="true">
                <span style={{ transform: `scaleX(${(view.index + 1) / count})` }} />
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
