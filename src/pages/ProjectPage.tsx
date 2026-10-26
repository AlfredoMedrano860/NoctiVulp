import { useEffect, useState } from 'react'
import screenshots from 'virtual:nv-screenshots'
import { LINKS, PATREON_PROJECTS } from '../config'
import type { Project } from '../data/projects'
import type { ProjectArt } from '../hooks/useProjectArt'
import { useLang, useT } from '../i18n'
import { fetchLatestRelease, fetchReadme, type Release } from '../lib/readme'
import { homePath, projectPath } from '../router'
import { ExternalButton } from '../components/ExternalButton'
import { ArrowIcon, GithubIcon, PatreonIcon } from '../components/Icons'
import { Link } from '../components/Link'
import { Magnetic } from '../components/Magnetic'
import { Reveal } from '../components/Reveal'
import { SplitReveal } from '../components/SplitReveal'

type ReadmeState = { status: 'loading' } | { status: 'ok'; html: string } | { status: 'error' }

function useReadme(repo: string | undefined) {
  const [state, setState] = useState<{ repo?: string; value: ReadmeState }>({ value: { status: 'loading' } })

  useEffect(() => {
    if (!repo) return
    let cancelled = false
    fetchReadme(repo).then(
      (html) => !cancelled && setState({ repo, value: { status: 'ok', html } }),
      () => !cancelled && setState({ repo, value: { status: 'error' } }),
    )
    return () => {
      cancelled = true
    }
  }, [repo])

  // si cambió de proyecto y aún no llega el nuevo README, se muestra "cargando"
  return state.repo === repo ? state.value : ({ status: 'loading' } as ReadmeState)
}

function useRelease(repo: string | undefined) {
  const [release, setRelease] = useState<{ repo?: string; value: Release | null }>({ value: null })
  useEffect(() => {
    if (!repo) return
    let cancelled = false
    fetchLatestRelease(repo).then((value) => !cancelled && setRelease({ repo, value }))
    return () => {
      cancelled = true
    }
  }, [repo])
  return release.repo === repo ? release.value : null
}

interface ProjectPageProps {
  name: string
  projects: Project[]
  art: ProjectArt
}

export function ProjectPage({ name, projects, art }: ProjectPageProps) {
  const t = useT()
  const lang = useLang()
  const index = projects.findIndex((p) => p.name.toLowerCase() === name.toLowerCase())
  const project = index >= 0 ? projects[index] : undefined
  const readme = useReadme(project?.name)
  const release = useRelease(project?.name)

  useEffect(() => {
    document.title = project ? `${project.name} · NoctiVulp` : t.meta.title
  }, [project, t])

  if (!projects.length) {
    return (
      <main id="main" className="pp pp--empty container">
        <span className="pulse" /> {t.work.loading}
      </main>
    )
  }

  if (!project) {
    return (
      <main id="main" className="pp pp--empty container">
        <h1>{t.project.notFound}</h1>
        <p className="text-muted">{t.project.notFoundText}</p>
        <Link to={homePath(lang, 'proyectos')} className="btn btn--primary">
          {t.project.backHome}
        </Link>
      </main>
    )
  }

  const shots = screenshots[project.name.toLowerCase()] ?? []
  const cover = shots[0] ?? art.urls[index]
  const prev = projects[(index - 1 + projects.length) % projects.length]
  const next = projects[(index + 1) % projects.length]
  const dateFormat = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric' })
  const onPatreon = PATREON_PROJECTS.some((n) => n.toLowerCase() === project.name.toLowerCase())

  return (
    <main id="main" className="pp" key={project.name}>
      <section className="pp-hero">
        <div className="container">
          <Link to={homePath(lang, 'proyectos')} className="pp-back">
            <span aria-hidden="true">←</span> {t.project.back}
          </Link>

          <div className="pp-hero__grid">
            <div className="pp-hero__copy">
              <span className="tag">{t.categories[project.category]}</span>
              <SplitReveal as="h1" className="pp-title" onScroll={false}>
                {project.name}
              </SplitReveal>
              <p className="pp-desc">{project.description || t.project.noDescription}</p>

              <dl className="work__meta pp-meta">
                {project.language && (
                  <div>
                    <dt>{t.work.language}</dt>
                    <dd>{project.language}</dd>
                  </div>
                )}
                {project.license && (
                  <div>
                    <dt>{t.work.license}</dt>
                    <dd>{project.license}</dd>
                  </div>
                )}
                {project.stars > 0 && (
                  <div>
                    <dt>{t.work.stars}</dt>
                    <dd>{project.stars}</dd>
                  </div>
                )}
                <div>
                  <dt>{t.work.updated}</dt>
                  <dd>{dateFormat.format(new Date(project.updatedAt))}</dd>
                </div>
              </dl>

              <div className="hero__actions">
                {release && (
                  <Magnetic>
                    <a href={release.url} target="_blank" rel="noreferrer" className="btn btn--primary">
                      {t.project.download} {release.tag} <ArrowIcon />
                    </a>
                  </Magnetic>
                )}
                {onPatreon && (
                  <ExternalButton href={LINKS.patreon} variant={release ? 'ghost' : 'primary'}>
                    <PatreonIcon /> {t.project.patreon}
                  </ExternalButton>
                )}
                <Magnetic>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`btn ${release || (onPatreon && LINKS.patreon) ? 'btn--ghost' : 'btn--primary'}`}
                  >
                    <GithubIcon /> {t.project.github}
                  </a>
                </Magnetic>
              </div>
            </div>

            <div className="pp-hero__media">
              {cover ? <img src={cover} alt="" /> : <div className="skeleton" />}
            </div>
          </div>
        </div>
      </section>

      {shots.length > 1 && (
        <section className="section pp-gallery">
          <div className="container">
            <p className="eyebrow">{t.project.gallery}</p>
            <div className="pp-gallery__grid">
              {shots.slice(1).map((src, i) => (
                <Reveal key={src} delay={i * 80}>
                  <a href={src} target="_blank" rel="noreferrer" className="pp-shot">
                    <img src={src} alt={`${project.name} · ${i + 2}`} loading="lazy" decoding="async" />
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section pp-readme-wrap">
        <div className="container">
          <p className="eyebrow">{t.project.readme}</p>
          {readme.status === 'ok' && <article className="readme" dangerouslySetInnerHTML={{ __html: readme.html }} />}
          {readme.status === 'loading' && (
            <p className="readme-state">
              <span className="pulse" /> {t.project.readmeLoading}
            </p>
          )}
          {readme.status === 'error' && (
            <p className="readme-state">
              {t.project.readmeError}{' '}
              <a href={project.url} target="_blank" rel="noreferrer" className="text-fire">
                {t.project.readmeOpen} ↗
              </a>
            </p>
          )}
        </div>
      </section>

      <nav className="pp-nav container" aria-label={`${t.project.prev} / ${t.project.next}`}>
        <Link to={projectPath(lang, prev.name)} className="pp-nav__link">
          <small>← {t.project.prev}</small>
          <span>{prev.name}</span>
        </Link>
        <Link to={projectPath(lang, next.name)} className="pp-nav__link pp-nav__link--next">
          <small>{t.project.next} →</small>
          <span>{next.name}</span>
        </Link>
      </nav>
    </main>
  )
}
