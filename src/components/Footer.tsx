import { useRef } from 'react'
import { LINKS } from '../config'
import { useT } from '../i18n'
import { gsap, loadSplitText, useGSAP } from '../lib/motion'
import { progressBetween, whileVisible } from '../lib/scroll'
import { ExternalButton } from './ExternalButton'
import { GithubIcon, PatreonIcon, YoutubeIcon } from './Icons'
import { MothLogo } from './MothLogo'
import { PaintedArt } from './PaintedArt'
import { SplitReveal } from './SplitReveal'

// Perfil de quien desarrolló el sitio (crédito del pie de página).
const DEVELOPER_LINKEDIN = 'https://www.linkedin.com/in/josealfredomedrano'

const YEAR = new Date().getFullYear()

export function Footer() {
  const t = useT()
  const rootRef = useRef<HTMLElement>(null)

  // La marca gigante sube letra por letra al llegar al final.
  useGSAP(
    (_context, contextSafe) => {
      if (!contextSafe) return
      let alive = true
      let stop: (() => void) | undefined
      const create = contextSafe((SplitText: Awaited<ReturnType<typeof loadSplitText>>) => {
        const mark = rootRef.current?.querySelector<HTMLElement>('.footer__wordmark')
        if (!alive || !mark) return
        const split = SplitText.create(mark, { type: 'chars', mask: 'chars' })
        const tl = gsap.timeline({ paused: true }).from(split.chars, { yPercent: 110, ease: 'power3.out', stagger: 0.04 })
        // Sigue al scroll: empieza cuando el borde de arriba llega al 95 % de la pantalla
        // y termina cuando el de abajo llega al 85 %.
        stop = whileVisible(
          mark,
          contextSafe(() => {
            const { top, height } = mark.getBoundingClientRect()
            const h = window.innerHeight
            const progress = progressBetween(h * 0.95 - top, 0, h * 0.1 + height)
            gsap.to(tl, { progress, duration: 0.6, ease: 'power2.out', overwrite: true })
          }),
        )
      })
      void loadSplitText().then(create)
      return () => {
        alive = false
        stop?.()
      }
    },
    { scope: rootRef },
  )

  return (
    <footer ref={rootRef} className="footer" data-scene="roof">
      <div className="container">
        <div className="cta">
          <PaintedArt kind="lamp" className="cta__lamp" />
          <SplitReveal as="h2" key={t.footer.title[0]}>
            {t.footer.title[0]}
            <span className="text-gradient">{t.footer.title[1]}</span>
            {t.footer.title[2]}
          </SplitReveal>
          <p>{t.footer.text}</p>
          <div className="hero__actions center">
            <ExternalButton href={LINKS.patreon} variant="primary">
              <PatreonIcon /> Patreon
            </ExternalButton>
            <ExternalButton href={LINKS.github} variant={LINKS.patreon ? 'ghost' : 'primary'}>
              <GithubIcon /> GitHub
            </ExternalButton>
            <ExternalButton href={LINKS.youtube}>
              <YoutubeIcon /> YouTube
            </ExternalButton>
          </div>
        </div>

        <p className="footer__wordmark" aria-hidden="true">
          NoctiVulp
        </p>

        <div className="footer__bottom">
          <span className="brand">
            <MothLogo size={26} /> NoctiVulp
          </span>
          <span className="text-muted">
            {t.header.status} · © {YEAR} NoctiVulp
          </span>
          <span className="footer__credit">
            {t.footer.developedBy}{' '}
            <a href={DEVELOPER_LINKEDIN} target="_blank" rel="noopener noreferrer">
              Alfredo Medrano
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
