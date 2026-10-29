import { LINKS } from '../config'
import { useT } from '../i18n'
import { ExternalButton } from './ExternalButton'
import { YoutubeIcon } from './Icons'
import { MothLogo } from './MothLogo'
import { PaintedArt } from './PaintedArt'
import { Reveal } from './Reveal'
import { SplitReveal } from './SplitReveal'
import { TiltCard } from './TiltCard'
import { MothLayer } from './MothLayer'

const CHANNELS = [
  { name: 'NoctiFox', href: LINKS.youtube, accent: 'fire' },
  { name: 'Noctivulp', href: LINKS.youtube, accent: 'red' },
]

export function Channels() {
  const t = useT()
  return (
    <section id="canales" className="section" data-scene="roof">
      <MothLayer positions={[{ top: '20%', left: '4%' }, { top: '80%', left: '62%' }, { top: '50%', left: '30%' }]} />
      <div className="container has-art">
        <PaintedArt kind="onair" className="section-art section-art--right" />
        <div className="section__head">
          <p className="eyebrow">{t.channels.eyebrow}</p>
          <SplitReveal as="h2" key={t.channels.title[0]}>
            {t.channels.title[0]}
            <span className="text-gradient">{t.channels.title[1]}</span>
            {t.channels.title[2]}
          </SplitReveal>
          <SplitReveal as="p" className="section__lead" delay={0.1} key={t.channels.lead}>
            {t.channels.lead}
          </SplitReveal>
        </div>

        <div className="grid grid--2">
          {CHANNELS.map((c, i) => {
            const copy = t.channels.items[i]
            return (
              <Reveal key={c.name} delay={i * 120}>
                <TiltCard className={`card channel channel--${c.accent}`}>
                  <div className="channel__avatar">
                    <MothLogo size={56} animated />
                  </div>
                  <p className="tier__kicker">{copy.role}</p>
                  <h3>{c.name}</h3>
                  <p>{copy.text}</p>
                  <div className="channel__tags">
                    {copy.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <ExternalButton href={c.href}>
                    <YoutubeIcon /> {t.channels.cta}
                  </ExternalButton>
                </TiltCard>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
