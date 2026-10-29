import { useRef } from 'react'
import { LINKS } from '../config'
import { useT } from '../i18n'
import { gsap, loadSplitText, useGSAP } from '../lib/motion'
import { ExternalButton } from './ExternalButton'
import { GithubIcon, PatreonIcon, YoutubeIcon } from './Icons'
import { Magnetic } from './Magnetic'
import { MothLogo } from './MothLogo'
import { PaintedArt } from './PaintedArt'
import { SplitReveal } from './SplitReveal'

const YEAR = new Date().getFullYear()

export function Footer() {
  const t = useT()
  const rootRef = useRef<HTMLElement>(null)

  // La marca gigante sube letra por letra al llegar al final.
  useGSAP(
    (_context, contextSafe) => {
      if (!contextSafe) return
      let alive = true
      const create = contextSafe((SplitText: Awaited<ReturnType<typeof loadSplitText>>) => {
        if (!alive) return
        const split = SplitText.create('.footer__wordmark', { type: 'chars', mask: 'chars' })
        gsap.from(split.chars, {
          yPercent: 110,
          ease: 'power3.out',
          stagger: 0.04,
          scrollTrigger: { trigger: '.footer__wordmark', start: 'top 95%', end: 'bottom 85%', scrub: 0.6 },
        })
      })
      void loadSplitText().then(create)
      return () => {
        alive = false
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
            <Magnetic>
              <ExternalButton href={LINKS.patreon} variant="primary">
                <PatreonIcon /> Patreon
              </ExternalButton>
            </Magnetic>
            <Magnetic>
              <ExternalButton href={LINKS.github} variant={LINKS.patreon ? 'ghost' : 'primary'}>
                <GithubIcon /> GitHub
              </ExternalButton>
            </Magnetic>
            <Magnetic>
              <ExternalButton href={LINKS.youtube}>
                <YoutubeIcon /> YouTube
              </ExternalButton>
            </Magnetic>
          </div>
        </div>

        <p className="footer__wordmark" aria-hidden="true">
          NoctiVulp
        </p>

        <div className="footer__bottom">
          <span className="brand">
            <MothLogo size={26} /> NoctiVulp
          </span>
          <span className="text-muted">© {YEAR} NoctiVulp</span>
        </div>
      </div>
    </footer>
  )
}
