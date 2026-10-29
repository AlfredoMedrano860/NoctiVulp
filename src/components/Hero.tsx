import { useEffect, useRef } from 'react'
import { LINKS, PAINTED_BACKGROUND } from '../config'
import type { Project } from '../data/projects'
import { useT } from '../i18n'
import { gsap, hasFinePointer, useGSAP } from '../lib/motion'
import { ExternalButton } from './ExternalButton'
import { GithubIcon, PatreonIcon, YoutubeIcon } from './Icons'
import { Magnetic } from './Magnetic'
import { MothLogo } from './MothLogo'
import { SplitReveal } from './SplitReveal'

interface HeroProps {
  projects: Project[]
  ready: boolean
}

export function Hero({ projects, ready }: HeroProps) {
  const t = useT()
  const rootRef = useRef<HTMLElement>(null)
  const artRef = useRef<HTMLDivElement>(null)
  const languages = new Set(projects.map((p) => p.language).filter(Boolean)).size

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

          <dl className="hero__stats" data-intro>
            <div>
              <dt>{t.hero.stats.repos}</dt>
              <dd>{projects.length || '—'}</dd>
            </div>
            <div>
              <dt>{t.hero.stats.languages}</dt>
              <dd>{languages || '—'}</dd>
            </div>
            <div>
              <dt>{t.hero.stats.open}</dt>
              <dd>100%</dd>
            </div>
          </dl>
        </div>

        <div ref={artRef} className="hero__art" aria-hidden="true">
          <div className="hero__orbit" />
          <div className="hero__orbit hero__orbit--2" />
          <MothLogo size={260} animated className="hero__moth" />
          <code className="hero__term">
            <span className="text-muted">$</span> git clone noctivulp-ch<span className="caret" />
          </code>
        </div>
      </div>

      <div className="hero__scroll" data-intro aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  )
}
