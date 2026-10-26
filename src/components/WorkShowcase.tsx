import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { Project } from '../data/projects'
import type { ProjectArt } from '../hooks/useProjectArt'
import { useLang, useT } from '../i18n'
import { scrollToTarget, ScrollTrigger, useGSAP } from '../lib/motion'
import { projectPath } from '../router'
import { ArrowIcon, GithubIcon } from './Icons'
import { Link } from './Link'
import { Magnetic } from './Magnetic'
import { RollingText } from './RollingText'

// Three.js pesa bastante: se carga aparte, cuando hace falta.
const WorkCanvas = lazy(() => import('./WorkCanvas').then((m) => ({ default: m.WorkCanvas })))

const pad = (n: number) => String(n).padStart(2, '0')

// Alto de scroll por proyecto (en vh). Más bajo = se recorre más rápido.
const VH_PER_PROJECT = 45

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

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section || !count) return
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const i = Math.min(count - 1, Math.floor(self.progress * count))
          if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`
          setView((prev) => (prev.index === i ? prev : { index: i, dir: i > prev.index ? 1 : -1 }))
        },
      })
    },
    { dependencies: [count], scope: sectionRef },
  )

  const jumpTo = useCallback(
    (i: number) => {
      const section = sectionRef.current
      if (!section || !count) return
      const target = Math.max(0, Math.min(count - 1, i))
      const range = section.offsetHeight - window.innerHeight
      scrollToTarget(section.offsetTop + ((target + 0.5) / count) * range)
    },
    [count],
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

  const project = projects[view.index]
  const detail = project ? projectPath(lang, project.name) : '#'

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
      ref={sectionRef}
      className="work"
      style={{ height: count ? `${count * VH_PER_PROJECT + 100}vh` : '100vh' }}
    >
      <div className="work__sticky">
        <div className="container work__layout">
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
                <Suspense fallback={art.urls[view.index] && <img className="work-canvas" src={art.urls[view.index]} alt="" />}>
                  <WorkCanvas arts={art.canvases} fallbackUrls={art.urls} index={view.index} />
                </Suspense>
              </Link>

              <div className="work__info">
                <span className="tag">
                  <RollingText text={t.categories[project.category]} direction={view.dir} />
                </span>
                <h2 className="work__title">
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
                    aria-label={p.name}
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
