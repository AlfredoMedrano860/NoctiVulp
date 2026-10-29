import { useMemo, useRef, useState } from 'react'
import { CATEGORIES, type Category, type Project } from '../data/projects'
import { useLang, useT } from '../i18n'
import { gsap, useGSAP } from '../lib/motion'
import { projectPath } from '../router'
import { ArrowIcon } from './Icons'
import { Link } from './Link'
import { SplitReveal } from './SplitReveal'

type Filter = Category | 'all'

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
      gsap.from('.index__row', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.05,
        scrollTrigger: { trigger: '.index__list', start: 'top 85%', once: true },
      })
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
          onPointerLeave={() => setHovered(null)}
        >
          {rows.map(({ p, i }) => (
            <li key={p.name}>
              <Link
                to={projectPath(lang, p.name)}
                className={`index__row ${hovered === i ? 'is-open' : ''}`}
                onPointerEnter={() => setHovered(i)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
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
