import { CHAT_KNOWLEDGE, type ChatLink } from '../data/chatKnowledge'
import type { Project } from '../data/projects'
import type { Lang } from '../i18n'

// Motor de respuestas del chatbot "Nocti" (sin IA y sin servidor). Busca la entrada de
// data/chatKnowledge.ts que mejor coincide: cada palabra clave encontrada suma tantos
// puntos como palabras tenga, así "por que linux" (3) le gana a "linux". Si la pregunta
// nombra un proyecto, responde con su descripción y un enlace a su ficha.

export type ChatReply = { text: string; link?: ChatLink | { project: string; label: string } } | null

// Minúsculas, sin tildes ni signos, con espacios al borde para buscar palabras completas.
function normalize(text: string) {
  const clean = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return ` ${clean} `
}

const score = (question: string, keywords: string[]) =>
  keywords.reduce((total, k) => (question.includes(normalize(k)) ? total + k.trim().split(' ').length : total), 0)

// Nombre del repo sin guiones ni mayúsculas: "cast-dlna-tv" también se encuentra como "cast dlna tv".
const plain = (name: string) => normalize(name.replace(/[-_]/g, ' ')).trim()

export function findReply(question: string, lang: Lang, projects: Project[]): ChatReply {
  const q = normalize(question)
  const qPlain = ` ${plain(question)} `

  // ¿Nombra un proyecto? Gana el nombre más largo ("cast-dlna-tv" antes que "cast-dlna").
  const project = [...projects]
    .sort((a, b) => b.name.length - a.name.length)
    .find((p) => q.includes(normalize(p.name)) || qPlain.includes(` ${plain(p.name)} `))
  if (project) {
    const desc = project.description || (lang === 'es' ? 'Todavía no tiene descripción.' : 'It has no description yet.')
    const extra = [project.language, project.license].filter(Boolean).join(' · ')
    return {
      text: `${project.name}: ${desc}${extra ? ` (${extra})` : ''}`,
      link: { project: project.name, label: lang === 'es' ? 'Ver el proyecto' : 'See the project' },
    }
  }

  // ¿Qué proyectos hay? Se arma con la lista real.
  if (score(q, ['proyectos', 'que programas', 'que haces', 'lista', 'projects', 'what programs', 'what do you make']) > 0 && projects.length) {
    const names = projects.slice(0, 6).map((p) => p.name).join(', ')
    const more = projects.length > 6 ? (lang === 'es' ? ` y ${projects.length - 6} más` : ` and ${projects.length - 6} more`) : ''
    return {
      text:
        lang === 'es'
          ? `Hay ${projects.length} proyectos: ${names}${more}. Escribe el nombre de uno y te cuento de qué trata.`
          : `There are ${projects.length} projects: ${names}${more}. Type the name of one and I'll tell you what it does.`,
      link: { section: 'proyectos', label: { es: 'Ver todos', en: 'See all' } },
    }
  }

  let best = null
  let bestScore = 0
  for (const entry of CHAT_KNOWLEDGE) {
    const s = score(q, entry.keywords)
    if (s > bestScore) {
      best = entry
      bestScore = s
    }
  }
  return best ? { text: best.answer[lang], link: best.link } : null
}
