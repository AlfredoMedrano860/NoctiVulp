import { useT } from '../i18n'
import { PaintedArt } from './PaintedArt'
import { Reveal } from './Reveal'
import { SplitReveal } from './SplitReveal'
import { TiltCard } from './TiltCard'
import { MothLayer } from './MothLayer'

export function Vision() {
  const t = useT()
  const { doText, goText } = t.vision
  return (
    <section id="vision" className="section section--alt" data-scene="roof">
      <MothLayer positions={[{ top: '10%', left: '84%' }, { top: '64%', left: '4%' }, { top: '40%', left: '58%' }]} />
      <div className="container has-art">
        <PaintedArt kind="kitsune" className="section-art section-art--kitsune" />
        <div className="grid grid--2">
          <TiltCard className="card statement">
            <p className="eyebrow">{t.vision.doLabel}</p>
            <SplitReveal as="p" className="statement__text" key={doText[0]}>
              {doText[0]}
              <em>{doText[1]}</em>
              {doText[2]}
            </SplitReveal>
          </TiltCard>
          <TiltCard className="card statement">
            <p className="eyebrow">{t.vision.goLabel}</p>
            <SplitReveal as="p" className="statement__text" delay={0.15} key={goText[0]}>
              {goText[0]}
              <em>{goText[1]}</em>
              {goText[2]}
            </SplitReveal>
          </TiltCard>
        </div>

        <div className="grid grid--4 values">
          {t.vision.rules.map((v, i) => (
            <Reveal key={v.title} delay={i * 90}>
              <div className="value">
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
