import { LINKS } from '../config'
import { useT } from '../i18n'
import type { ArtKind } from '../lib/paint/sizes'
import { MothLayer } from './MothLayer'
import { ExternalButton } from './ExternalButton'
import { PatreonIcon } from './Icons'
import { Magnetic } from './Magnetic'
import { PaintedArt } from './PaintedArt'
import { Reveal } from './Reveal'
import { SplitReveal } from './SplitReveal'
import { TiltCard } from './TiltCard'

// El nivel del medio (Patreon) es el destacado.
const FEATURED = 1
const TIER_ART: ArtKind[] = ['scroll', 'heart', 'wrench']

export function Model() {
  const t = useT()
  return (
    <section id="modelo" className="section" data-scene="alley">
      <MothLayer positions={[{ top: '12%', left: '8%' }, { top: '58%', left: '92%' }, { top: '90%', left: '40%' }]} />
      <div className="container has-art">
        <div className="garland" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <PaintedArt key={i} kind="lanterns" className="garland__piece" />
          ))}
        </div>
        <div className="section__head section__head--center">
          <p className="eyebrow">{t.model.eyebrow}</p>
          <SplitReveal as="h2" key={t.model.title[0]}>
            {t.model.title[0]}
            <span className="text-gradient">{t.model.title[1]}</span>
            {t.model.title[2]}
          </SplitReveal>
          <SplitReveal as="p" className="section__lead" delay={0.1} key={t.model.lead}>
            {t.model.lead}
          </SplitReveal>
        </div>

        <div className="grid grid--3">
          {t.model.tiers.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 120}>
              <TiltCard className={`card tier ${i === FEATURED ? 'tier--featured' : ''}`}>
                <div className="tier__stub">
                  <PaintedArt kind={TIER_ART[i % TIER_ART.length]} className="card-art" />
                  <p className="tier__kicker">{tier.kicker}</p>
                  <h3>{tier.name}</h3>
                  <p className="tier__serial" aria-hidden="true">
                    Nº {String(i + 1).padStart(3, '0')} · NoctiVulp
                  </p>
                </div>
                <ul>
                  {tier.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {i === FEATURED && (
                  <Magnetic>
                    <ExternalButton href={LINKS.patreon} variant="primary">
                      <PatreonIcon /> {t.model.patreonCta}
                    </ExternalButton>
                  </Magnetic>
                )}
              </TiltCard>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <aside className="card callout">
            <div>
              <p className="eyebrow">{t.model.side.eyebrow}</p>
              <h3>{t.model.side.title}</h3>
              <p>{t.model.side.text}</p>
            </div>
            <code className="callout__code">
              {t.model.side.steps.map((step, i) => (
                <span key={step} className={i === 0 ? 'text-muted' : undefined}>
                  {step}
                  <br />
                </span>
              ))}
            </code>
          </aside>
        </Reveal>
      </div>
    </section>
  )
}
