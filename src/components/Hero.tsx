import { useEffect, useRef } from 'react'
import { LINKS, PAINTED_BACKGROUND } from '../config'
import type { Project } from '../data/projects'
import { useLang, useT } from '../i18n'
import { projectPath } from '../router'
import { Link } from './Link'
import { gsap, hasFinePointer, useGSAP } from '../lib/motion'
import { ExternalButton } from './ExternalButton'
import { GithubIcon, PatreonIcon, YoutubeIcon } from './Icons'
import { Magnetic } from './Magnetic'
import { MothLogo } from './MothLogo'
import { SplitReveal } from './SplitReveal'

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

function timeAgo(iso: string, lang: string) {
  const seconds = (Date.parse(iso) - Date.now()) / 1000
  const format = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? ['minute', 60]
  return format.format(Math.round(seconds / size), unit)
}

interface HeroProps {
  projects: Project[]
  ready: boolean
}

export function Hero({ projects, ready }: HeroProps) {
  const t = useT()
  const rootRef = useRef<HTMLElement>(null)
  const artRef = useRef<HTMLDivElement>(null)
  const lang = useLang()
  const latest = projects.reduce<Project | null>((a, p) => (!a || p.updatedAt > a.updatedAt ? p : a), null)

  // Entrada después del preloader + parallax al hacer scroll.
  useGSAP(
    () => {
      if (!ready) return
      gsap
        .timeline({ delay: 0.25 })
        .from('[data-intro]:not(.hero__lead)', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08 })
        .from('.hero__lead', { y: 30, duration: 1, ease: 'power3.out' }, 0.08)
        .from('.hero__art', { scale: 0.7, opacity: 0, duration: 1.6, ease: 'expo.out' }, 0)

      gsap.to('.hero__copy', {
        yPercent: -18,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.hero__art', {
        yPercent: 25,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    },
    { dependencies: [ready], scope: rootRef },
  )

  // La polilla sigue al mouse.
  useEffect(() => {
    const art = artRef.current
    const root = rootRef.current
    if (!art || !root || !hasFinePointer()) return
    const moth = art.querySelector('.hero__moth')
    const orbits = art.querySelectorAll('.hero__orbit')
    const mx = gsap.quickTo(moth, 'x', { duration: 1, ease: 'power3' })
    const my = gsap.quickTo(moth, 'y', { duration: 1, ease: 'power3' })
    const mr = gsap.quickTo(moth, 'rotation', { duration: 1.2, ease: 'power3' })
    const ox = gsap.quickTo(orbits, 'x', { duration: 1.4, ease: 'power3' })
    const oy = gsap.quickTo(orbits, 'y', { duration: 1.4, ease: 'power3' })

    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      mx(nx * 60)
      my(ny * 40)
      mr(nx * 14)
      ox(nx * -30)
      oy(ny * -20)
    }
    root.addEventListener('pointermove', onMove)
    return () => root.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <section id="top" data-scene="city" ref={rootRef} className={`hero ${ready ? 'is-ready' : ''} ${PAINTED_BACKGROUND ? 'hero--painted' : ''}`}>
      <div className="hero__glow" aria-hidden="true" />

      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="eyebrow" data-intro>
            <span className="pulse" /> {t.hero.eyebrow}
          </p>
          <SplitReveal as="h1" className="hero__title" play={ready} onScroll={false} delay={0.15} key={t.hero.title[0]}>
            {t.hero.title[0]}
            <span className="text-gradient">{t.hero.title[1]}</span>
            {t.hero.title[2]}
          </SplitReveal>
          <p className="hero__lead" data-intro>
            {t.hero.lead}
          </p>

          <div className="hero__actions" data-intro>
            <Magnetic>
              <a href="#proyectos" className="btn btn--primary">
                {t.hero.cta}
              </a>
            </Magnetic>
            <Magnetic>
              <ExternalButton href={LINKS.github}>
                <GithubIcon /> GitHub
              </ExternalButton>
            </Magnetic>
            <ExternalButton href={LINKS.youtube}>
              <YoutubeIcon /> YouTube
            </ExternalButton>
            <ExternalButton href={LINKS.patreon}>
              <PatreonIcon /> Patreon
            </ExternalButton>
          </div>

          {latest && (
            <p className="hero__log" data-intro>
              <span className="dot dot--live" aria-hidden="true" />
              {t.hero.log.updated} <time dateTime={latest.updatedAt}>{timeAgo(latest.updatedAt, lang)}</time> {t.hero.log.on}{' '}
              <Link to={projectPath(lang, latest.name)}>{latest.name}</Link>
              <span className="hero__log-sep" aria-hidden="true">
                /
              </span>
              {projects.length} {t.hero.log.repos}
            </p>
          )}
        </div>

        <div ref={artRef} className="hero__art">
          <div className="hero__orbit" aria-hidden="true" />
          <div className="hero__orbit hero__orbit--2" aria-hidden="true" />
          <MothLogo size={260} animated className="hero__moth" />
          <a className="hero__term" href={LINKS.github} target="_blank" rel="noreferrer" aria-label={t.hero.githubProfile}>
            <code>
              <span className="text-muted">$</span> open github.com/noctivulp-ch<span className="caret" aria-hidden="true" />
            </code>
          </a>
        </div>
      </div>

      <div className="hero__scroll" data-intro aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  )
}
