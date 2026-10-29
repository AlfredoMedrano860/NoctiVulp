import { useT } from '../i18n'
import type { ArtKind } from '../lib/paint/sizes'
import { MothLayer } from './MothLayer'
import { PaintedArt } from './PaintedArt'
import { Reveal } from './Reveal'
import { SplitReveal } from './SplitReveal'
import { TiltCard } from './TiltCard'

const REASON_ART: ArtKind[] = ['laptop', 'gamepad', 'usb']

export function WhyLinux() {
  const t = useT()
  return (
    <section id="por-que-linux" className="section section--alt" data-scene="alley">
      <MothLayer positions={[{ top: '18%', left: '46%' }, { top: '72%', left: '6%' }, { top: '86%', left: '78%' }]} />
      <div className="container has-art">
        <PaintedArt kind="crt" className="section-art section-art--right section-art--crt" />
        <div className="section__head">
          <p className="eyebrow">{t.why.eyebrow}</p>
          <SplitReveal as="h2" key={t.why.title[0]}>
            {t.why.title[0]}
            <span className="text-gradient">{t.why.title[1]}</span>
            {t.why.title[2]}
          </SplitReveal>
          <SplitReveal as="p" className="section__lead" delay={0.1} key={t.why.lead}>
            {t.why.lead}
          </SplitReveal>
        </div>

        <div className="grid grid--3">
          {t.why.reasons.map((r, i) => (
            <Reveal key={r.title} delay={i * 120}>
              <TiltCard className="card reason">
                <PaintedArt kind={REASON_ART[i % REASON_ART.length]} className="card-art" />
                <span className="reason__num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
