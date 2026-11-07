import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, type Category, type Project } from '../data/projects'
import { useLang, useT } from '../i18n'
import { gsap, useGSAP } from '../lib/motion'
import { onReach } from '../lib/scroll'
import { projectPath } from '../router'
import { ArrowIcon } from './Icons'
import { Link } from './Link'
import { SplitReveal } from './SplitReveal'

type Filter = Category | 'all'

// Cuánto tiene que quedarse el cursor sobre una fila para abrirla. Al pasar rápido por la
// lista no se abre ninguna: abrir una fila anima su alto y empuja a las de abajo, y abrir
// y cerrar varias seguidas trababa la página.
const HOVER_DELAY_MS = 90

interface ProjectIndexProps {
  projects: Project[]
  artUrls: string[]
}

// Índice tipo archivo: al pasar el cursor la fila se abre y muestra la descripción y la portada.
export function ProjectIndex({ projects, artUrls }: ProjectIndexProps) {
  const t = useT()
  const lang = useLang()
  const sectionRef = useRef<HTMLElement>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [hovered, setHovered] = useState<number | null>(null)
  const hoverTimer = useRef(0)
  const hoverLater = (index: number) => {
    window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => setHovered(index), HOVER_DELAY_MS)
  }
  const clearHover = () => {
    window.clearTimeout(hoverTimer.current)
    setHovered(null)
  }
  useEffect(() => () => window.clearTimeout(hoverTimer.current), [])

  const counts = useMemo(() => {
    const c: Partial<Record<Category, number>> = {}
    for (const p of projects) c[p.category] = (c[p.category] ?? 0) + 1
    return c
  }, [projects])

  const filters: Filter[] = ['all', ...CATEGORIES.filter((c) => counts[c])]
  const rows = projects
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => filter === 'all' || p.category === filter)

  useGSAP(
    () => {
      const list = sectionRef.current?.querySelector('.index__list')
      if (!list) return
      const tween = gsap.from('.index__row', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05, paused: true })
      return onReach(list, () => tween.play(), 0.85)
    },
    { dependencies: [filter, projects.length], scope: sectionRef, revertOnUpdate: true },
  )

  return (
    <section ref={sectionRef} className="section index" data-scene="city">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">{t.index.eyebrow}</p>
          <SplitReveal as="h2" key={t.index.title[0]}>
            {t.index.title[0]}
            <span className="text-gradient">{t.index.title[1]}</span>
            {t.index.title[2]}
          </SplitReveal>
        </div>

        <div className="filters" role="tablist" aria-label={t.index.filterLabel}>
          {filters.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={`chip ${filter === f ? 'chip--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? t.index.all : t.categories[f]}
              <span className="chip__count">{f === 'all' ? projects.length : counts[f]}</span>
            </button>
          ))}
        </div>

        <ul
          className={`index__list ${hovered !== null ? 'has-hover' : ''}`}
          onPointerLeave={clearHover}
        >
          {rows.map(({ p, i }) => (
            <li key={p.name} className={hovered === i ? 'is-current' : undefined}>
              <Link
                to={projectPath(lang, p.name)}
                className={`index__row ${hovered === i ? 'is-open' : ''}`}
                onPointerEnter={() => hoverLater(i)}
                onFocus={() => setHovered(i)}
                onBlur={clearHover}
              >
                <span className="index__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="index__main">
                  <span className="index__name">{p.name}</span>
                  <span className="index__meta">
                    {t.categories[p.category]} · {p.language ?? '—'}
                    {p.license ? ` · ${p.license}` : ''}
                  </span>
                  <span className="index__more">
                    <span className="index__desc">{p.description || t.project.noDescription}</span>
                  </span>
                </span>
                <span className="index__thumb" aria-hidden="true">
                  {artUrls[i] && <img src={artUrls[i]} alt="" loading="lazy" decoding="async" />}
                </span>
                <span className="index__arrow">
                  <ArrowIcon />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
