import type { CSSProperties } from 'react'
import { CHANNEL_NAMES } from '../config'
import type { Project } from '../data/projects'
import { useT, type Dict, type SectionId } from '../i18n'

interface Line {
  text: string
  meta?: string
  muted?: boolean
}

interface Screen {
  path: string
  cmd: string
  lines: Line[]
}

const MAX_REPOS = 4

// Qué "muestra" la terminal para cada sección: siempre contenido real del sitio.
function screenFor(id: SectionId, t: Dict, projects: Project[]): Screen {
  switch (id) {
    case 'top':
      return {
        path: '~',
        cmd: 'whoami',
        lines: [
          { text: 'noctivulp' },
          { text: t.menu.items.top.words.join(' '), muted: true },
          ...(projects.length ? [{ text: `${projects.length} ${t.hero.log.repos}`, muted: true }] : []),
        ],
      }
    case 'proyectos':
      return {
        path: '~/proyectos',
        cmd: 'ls',
        lines: [
          ...projects.slice(0, MAX_REPOS).map((p) => ({ text: p.name, meta: p.language ?? '' })),
          ...(projects.length > MAX_REPOS ? [{ text: `+${projects.length - MAX_REPOS}`, muted: true }] : []),
        ],
      }
    case 'por-que-linux':
      return { path: '~/por-que-linux', cmd: 'cat README', lines: t.why.reasons.map((r) => ({ text: r.title })) }
    case 'modelo':
      return { path: '~/modelo', cmd: 'cat README', lines: t.model.tiers.map((tier) => ({ text: tier.name, meta: tier.kicker })) }
    case 'vision':
      return { path: '~/vision', cmd: 'cat README', lines: t.vision.rules.map((r) => ({ text: r.title })) }
    case 'canales':
      return {
        path: '~/canales',
        cmd: 'ls',
        lines: CHANNEL_NAMES.map((name, i) => ({ text: name, meta: t.channels.items[i]?.role ?? '' })),
      }
  }
}

interface MenuTerminalProps {
  id: SectionId
  index: number
  total: number
  projects: Project[]
}

// Vista previa del menú: una terminal que "entra" a la sección señalada.
export function MenuTerminal({ id, index, total, projects }: MenuTerminalProps) {
  const t = useT()
  const screen = screenFor(id, t, projects)
  const [first, second] = t.menu.items[id].words
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="term">
      <div className="term__bar">
        <span className="term__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="term__title">noctivulp@linux: {screen.path}</span>
      </div>

      {/* key: cada sección vuelve a escribir su comando desde cero */}
      <div className="term__body" key={id} style={{ '--chars': screen.cmd.length } as CSSProperties}>
        <p className="term__prompt">
          <span className="term__path">{screen.path}</span> <span className="term__sign">$</span>{' '}
          <span className="term__cmd">{screen.cmd}</span>
        </p>
        <ul className="term__out">
          {screen.lines.map((line, i) => (
            <li
              key={`${line.text}-${i}`}
              className={`term__line ${line.muted ? 'is-muted' : ''}`}
              style={{ '--i': i } as CSSProperties}
            >
              <span>{line.text}</span>
              {line.meta && <span className="term__meta">{line.meta}</span>}
            </li>
          ))}
        </ul>
        <p className="term__prompt term__prompt--idle" style={{ '--i': screen.lines.length } as CSSProperties}>
          <span className="term__path">{screen.path}</span> <span className="term__sign">$</span>
          <span className="caret" />
        </p>
      </div>

      <div className="term__foot" key={`foot-${id}`}>
        <span className="term__num">
          {pad(index + 1)} <span>/ {pad(total)}</span>
        </span>
        <p className="term__words">
          {first} <span>{second}</span>
        </p>
      </div>
    </div>
  )
}
