import { useT } from '../i18n'
import { Reveal } from './Reveal'
import { SplitReveal } from './SplitReveal'
import { TiltCard } from './TiltCard'

export function WhyLinux() {
  const t = useT()
  return (
    <section id="por-que-linux" className="section section--alt">
      <div className="container">
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
