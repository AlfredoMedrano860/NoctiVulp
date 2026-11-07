import type { Lang, SectionId } from '../i18n'

// Base de conocimiento del chatbot "Nocti". Cada entrada tiene palabras clave (en español
// e inglés, en minúsculas y sin tildes; pueden ser frases, y las frases largas pesan más),
// la respuesta en los dos idiomas y, si hace falta, un enlace para leer más.
//
// Para agregar una pregunta nueva: añade una entrada con un id único. Si dos entradas
// empatan gana la que está primero; por eso el saludo y las gracias van al final.

type Texto = Record<Lang, string>

export type ChatLink = { section: SectionId; label: Texto } | { href: string; label: Texto }

export interface ChatEntry {
  id: string
  keywords: string[]
  answer: Texto
  link?: ChatLink
}

export const CHAT_KNOWLEDGE: ChatEntry[] = [
  {
    id: 'que-es',
    keywords: ['noctivulp', 'que es', 'quien eres', 'quien es', 'de que trata', 'what is', 'who are you', 'about'],
    answer: {
      es: 'NoctiVulp hace programas de código abierto para Linux: herramientas chicas para quien viene de Windows y otras más grandes para quien ya lo usa a diario. Hay de escritorio, de gaming y de modding.',
      en: 'NoctiVulp makes open-source programs for Linux: small tools for people coming from Windows and bigger ones for people who already use it every day. There are desktop, gaming and modding tools.',
    },
    link: { section: 'vision', label: { es: 'Lo que hago', en: 'What I do' } },
  },
  // Si la lista de proyectos todavía no cargó, lib/chatbot.ts no puede nombrarlos: esta
  // respuesta lleva a la sección.
  {
    id: 'proyectos',
    keywords: ['proyectos', 'programas', 'herramientas', 'que haces', 'projects', 'programs', 'tools', 'what do you make'],
    answer: {
      es: 'Hay herramientas de escritorio para Linux, de gaming y modding, apps y diseño. En la sección de proyectos están todas, con su descripción y su código.',
      en: 'There are Linux desktop tools, gaming and modding tools, apps and design. The projects section has all of them, with their description and code.',
    },
    link: { section: 'proyectos', label: { es: 'Ver proyectos', en: 'See projects' } },
  },
  {
    id: 'precio',
    keywords: ['gratis', 'precio', 'cuesta', 'pagar', 'paga', 'cobras', 'free', 'price', 'cost', 'pay', 'how much'],
    answer: {
      es: 'El código siempre es libre y está en GitHub: puedes compilarlo tú. Lo que está en Patreon es el programa ya compilado y listo para instalar, y los programas más grandes van en niveles más altos.',
      en: 'The code is always free and on GitHub: you can build it yourself. What Patreon has is the program already built and ready to install, and bigger programs go in higher tiers.',
    },
    link: { section: 'modelo', label: { es: 'Cómo se paga', en: 'How it is paid' } },
  },
  {
    id: 'patreon',
    keywords: ['patreon', 'apoyar', 'apoyo', 'donar', 'suscripcion', 'support', 'donate', 'subscription', 'compilado', 'build'],
    answer: {
      es: 'En Patreon están los compilados oficiales de cada programa. Con ese apoyo se sigue sacando código libre.',
      en: 'Patreon has the official builds of every program. That support is what keeps the free code coming.',
    },
    link: { href: 'https://www.patreon.com/cw/NoctiVulp', label: { es: 'Abrir Patreon', en: 'Open Patreon' } },
  },
  {
    id: 'comisiones',
    keywords: ['comision', 'comisiones', 'encargo', 'encargar', 'pedir un programa', 'contratar', 'commission', 'hire', 'custom', 'request'],
    answer: {
      es: 'Sí, se aceptan comisiones: que un programa que ya usas haga algo nuevo o funcione en Linux, un programa para un problema tuyo o mods para juegos.',
      en: 'Yes, commissions are open: making a program you already use do something new or run on Linux, a program for a problem of yours, or game mods.',
    },
    link: { section: 'modelo', label: { es: 'Ver comisiones', en: 'See commissions' } },
  },
  {
    id: 'licencia',
    keywords: ['licencia', 'fork', 'comercial', 'usar el codigo', 'gpl', 'license', 'commercial', 'use the code'],
    answer: {
      es: 'Puedes leer el código, compilarlo o hacerle un fork para uso no comercial, siempre que digas de dónde salió. Cada repo indica su licencia (la mayoría son GPL-3.0).',
      en: 'You can read the code, build it or fork it for non-commercial use, as long as you credit where it came from. Each repo lists its license (most are GPL-3.0).',
    },
    link: { section: 'modelo', label: { es: 'Cómo se paga', en: 'How it is paid' } },
  },
  {
    id: 'github',
    keywords: ['github', 'codigo', 'repo', 'repos', 'repositorio', 'source', 'code'],
    answer: {
      es: 'Todo el código está en GitHub, en la cuenta noctivulp-ch. Aunque el compilado esté en Patreon, el código siempre es público.',
      en: 'All the code is on GitHub, under the noctivulp-ch account. Even when the build is on Patreon, the code is always public.',
    },
    link: { href: 'https://github.com/noctivulp-ch', label: { es: 'Abrir GitHub', en: 'Open GitHub' } },
  },
  {
    id: 'por-que-linux',
    keywords: ['por que linux', 'cambiarme', 'cambiarse', 'windows 10', 'windows 11', 'windows', 'why linux', 'switch'],
    answer: {
      es: 'Muchos equipos quedaron fuera de Windows 11, los juegos ya corren gracias a Proton y hay distros que se instalan casi como Windows. Lo que falta son programas que se sientan conocidos, y ahí entra NoctiVulp.',
      en: 'Lots of PCs were left out of Windows 11, games already run thanks to Proton and some distros install almost like Windows. What is missing is programs that feel familiar, and that is where NoctiVulp comes in.',
    },
    link: { section: 'por-que-linux', label: { es: 'Por qué Linux', en: 'Why Linux' } },
  },
  {
    id: 'juegos',
    keywords: ['juego', 'juegos', 'gaming', 'steam', 'proton', 'mod', 'mods', 'modding', 'game', 'games'],
    answer: {
      es: 'Con Proton buena parte del catálogo de Steam ya corre en Linux. NoctiVulp también tiene herramientas de gaming y modding, y mods por encargo.',
      en: 'With Proton a good part of the Steam catalog already runs on Linux. NoctiVulp also has gaming and modding tools, and mods on commission.',
    },
    link: { section: 'proyectos', label: { es: 'Ver proyectos', en: 'See projects' } },
  },
  {
    id: 'traducciones',
    keywords: ['traduccion', 'traducciones', 'traducir', 'espanol', 'ia', 'translation', 'translate', 'ai'],
    answer: {
      es: 'Hay traducciones de juegos con IA: un script saca los textos del juego, los pasa por un modelo de IA y los vuelve a meter. No queda perfecto, pero alcanza para jugar en español.',
      en: 'There are AI game translations: a script pulls the game texts, runs them through an AI model and puts them back. It is not perfect, but good enough to play in your language.',
    },
    link: { section: 'modelo', label: { es: 'Traducciones con IA', en: 'AI translations' } },
  },
  {
    id: 'canales',
    keywords: ['youtube', 'canal', 'canales', 'video', 'videos', 'stream', 'noctifox', 'channel', 'bilibili'],
    answer: {
      es: 'Hay dos canales de YouTube: Noctivulp, donde se ve cómo avanzan los proyectos, y NoctiFox, con gameplays y mods jugados en Linux. Más adelante habrá streams.',
      en: 'There are two YouTube channels: Noctivulp, where you see the projects take shape, and NoctiFox, with gameplays and mods played on Linux. Streams are planned.',
    },
    link: { section: 'canales', label: { es: 'Ver canales', en: 'See channels' } },
  },
  {
    id: 'hyprland',
    keywords: ['hyprland', 'distro', 'escritorio', 'que usas', 'desktop', 'what do you use'],
    answer: {
      es: 'Se trabaja en Linux con Hyprland todos los días: lo que se publica corre en esa máquina.',
      en: 'The work happens on Linux with Hyprland every day: what gets published runs on that machine.',
    },
    link: { section: 'vision', label: { es: 'Lo que hago', en: 'What I do' } },
  },
  {
    id: 'contacto',
    keywords: ['contacto', 'contactar', 'escribir', 'hablar', 'correo', 'contact', 'email', 'reach'],
    answer: {
      es: 'Para pedir algo o comentar un proyecto, lo más directo es abrir un issue en GitHub o escribir por Patreon.',
      en: 'To ask for something or comment on a project, the quickest way is to open an issue on GitHub or write on Patreon.',
    },
    link: { href: 'https://github.com/noctivulp-ch', label: { es: 'Abrir GitHub', en: 'Open GitHub' } },
  },
  {
    id: 'saludo',
    keywords: ['hola', 'buenas', 'hey', 'hi', 'hello'],
    answer: {
      es: '¡Hola! Pregúntame por los proyectos, cómo se paga, las comisiones o los canales.',
      en: 'Hi! Ask me about the projects, how it is paid, commissions or the channels.',
    },
  },
  {
    id: 'gracias',
    keywords: ['gracias', 'genial', 'thanks', 'thank you', 'cool'],
    answer: {
      es: '¡De nada! Si algo te sirvió, puedes apoyarlo en Patreon.',
      en: 'You are welcome! If something helped you, you can support it on Patreon.',
    },
  },
]
