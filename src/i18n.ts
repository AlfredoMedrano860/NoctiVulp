import { createContext, useContext } from 'react'
import type { Category } from './data/projects.ts'

export type Lang = 'es' | 'en'
export const LANGS: Lang[] = ['es', 'en']

export type SectionId = 'top' | 'proyectos' | 'por-que-linux' | 'modelo' | 'vision' | 'canales'

// Texto con una parte resaltada: [antes, resaltado, después]
type Highlighted = [string, string, string]

export interface Dict {
  meta: { title: string; description: string; locale: string }
  skip: string
  header: { status: string; menu: string; close: string; home: string; otherLang: string }
  menu: { label: string; items: Record<SectionId, { label: string; words: [string, string] }> }
  hero: {
    eyebrow: string
    title: Highlighted
    lead: string
    cta: string
    stats: { repos: string; languages: string; open: string }
  }
  work: {
    eyebrow: string
    live: string
    offline: string
    loading: string
    language: string
    stars: string
    license: string
    updated: string
    viewProject: string
    cursor: string
    navLabel: string
  }
  index: { eyebrow: string; title: Highlighted; filterLabel: string; all: string }
  categories: Record<Category, string>
  why: { eyebrow: string; title: Highlighted; lead: string; reasons: { title: string; text: string }[] }
  model: {
    eyebrow: string
    title: Highlighted
    lead: string
    tiers: { name: string; kicker: string; items: string[] }[]
    patreonCta: string
    side: { eyebrow: string; title: string; text: string; steps: string[] }
  }
  vision: {
    doLabel: string
    doText: Highlighted
    goLabel: string
    goText: Highlighted
    rules: { title: string; text: string }[]
  }
  channels: {
    eyebrow: string
    title: Highlighted
    lead: string
    items: { role: string; text: string; tags: string[] }[]
    cta: string
  }
  footer: { title: Highlighted; text: string }
  marquee: [string[], string[]]
  project: {
    back: string
    github: string
    download: string
    patreon: string
    readme: string
    readmeLoading: string
    readmeError: string
    readmeOpen: string
    gallery: string
    prev: string
    next: string
    notFound: string
    notFoundText: string
    backHome: string
    noDescription: string
  }
  a11y: {
    open: string
    title: string
    close: string
    tabs: { reading: string; vision: string; tools: string }
    reader: string
    readerOn: string
    readerOff: string
    readerSpeaking: string
    readerUnsupported: string
    enableReader: string
    readPage: string
    readSelection: string
    stop: string
    clickToRead: string
    readFocus: string
    fontSize: string
    contrast: string
    links: string
    dyslexia: string
    spacing: string
    colorMode: string
    colors: { normal: string; monochrome: string; 'low-saturation': string; 'high-saturation': string }
    bigCursor: string
    readingGuide: string
    stopAnimations: string
    toolsHint: string
    reset: string
    toTop: string
  }
}

const es: Dict = {
  meta: {
    title: 'NoctiVulp · Programas para Linux',
    description:
      'Herramientas de código abierto para quien llega a Linux y para quien ya lo usa a diario. Escritorio, gaming y modding.',
    locale: 'es_ES',
  },
  skip: 'Saltar al contenido',
  header: { status: 'Aceptando comisiones', menu: 'Menú', close: 'Cerrar', home: 'Inicio', otherLang: 'EN' },
  menu: {
    label: 'Menú principal',
    items: {
      top: { label: 'Inicio', words: ['Linux', 'de noche'] },
      proyectos: { label: 'Proyectos', words: ['Código', 'abierto'] },
      'por-que-linux': { label: 'Por qué Linux', words: ['Adiós', 'Windows 10'] },
      modelo: { label: 'Modelo', words: ['Gratis', 'o Patreon'] },
      vision: { label: 'Lo que hago', words: ['Sin', 'tutorial'] },
      canales: { label: 'Canales', words: ['NoctiFox', 'Noctivulp'] },
    },
  },
  hero: {
    eyebrow: 'Linux · Proton · Modding',
    title: ['Hago programas para que Linux se sienta ', 'menos raro', ''],
    lead: 'Herramientas chicas para quien viene de Windows y no quiere pelearse con la terminal, y otras más grandes para quien ya la usa a diario. Todo el código está en GitHub.',
    cta: 'Ver proyectos',
    stats: { repos: 'Repositorios', languages: 'Lenguajes', open: 'Código abierto' },
  },
  work: {
    eyebrow: 'Proyectos',
    live: 'en vivo desde GitHub',
    offline: 'vista sin conexión',
    loading: 'Cargando proyectos…',
    language: 'Lenguaje',
    stars: 'Estrellas',
    license: 'Licencia',
    updated: 'Actualizado',
    viewProject: 'Ver proyecto',
    cursor: 'Ver',
    navLabel: 'Ir a un proyecto',
  },
  index: { eyebrow: 'Índice', title: ['Todos los ', 'repositorios', ''], filterLabel: 'Filtrar proyectos', all: 'Todos' },
  categories: { linux: 'Escritorio Linux', gaming: 'Gaming y modding', apps: 'Apps', design: 'Diseño' },
  why: {
    eyebrow: 'Por qué Linux',
    title: ['Cada vez más gente ', 'se cambia', ''],
    lead: 'Y no solo gente que programa. Estos son los motivos que más se repiten:',
    reasons: [
      {
        title: 'Windows 11 no entra en tu PC',
        text: 'Microsoft dejó fuera a un montón de equipos que funcionan perfecto. Ponerle Linux a una de esas máquinas sale más barato que comprar otra.',
      },
      {
        title: 'Los juegos ya corren',
        text: 'Proton, la capa de Valve basada en Wine, hace funcionar en Linux buena parte del catálogo de Steam. Antes jugar era la excusa para no cambiarse.',
      },
      {
        title: 'Instalarlo ya no da miedo',
        text: 'Hay distros que se instalan y se usan casi como Windows. Lo que todavía cuesta encontrar son programas que se sientan conocidos, y ahí es donde entro yo.',
      },
    ],
  },
  model: {
    eyebrow: 'Modelo',
    title: ['¿Cómo se ', 'paga', ' esto?'],
    lead: 'El código es libre: puedes leerlo, compilarlo o hacerle un fork para uso no comercial, siempre que digas de dónde salió. Lo que está en Patreon es el programa ya compilado y listo para instalar.',
    tiers: [
      { name: 'Gratis', kicker: '$0', items: ['Herramientas pequeñas, listas para usar', 'Todo el código en GitHub', 'Puedes compilarlo tú mismo'] },
      {
        name: 'Patreon',
        kicker: 'Suscripción',
        items: ['Los compilados oficiales de cada programa', 'Programas más grandes, niveles más altos', 'Con eso sigo sacando código libre'],
      },
      {
        name: 'Comisiones',
        kicker: 'Por encargo',
        items: ['Que un programa que ya usas haga algo nuevo o funcione en Linux', 'Un programa para un problema tuyo', 'Mods para juegos'],
      },
    ],
    patreonCta: 'Apoyar en Patreon',
    side: {
      eyebrow: 'De paso',
      title: 'Traducciones de juegos con IA',
      text: 'Un script saca los textos del juego, los pasa por un modelo de IA y los vuelve a meter. No queda perfecto, pero alcanza para jugar en español cosas que nunca se iban a traducir.',
      steps: ['# así funciona', '1. extraer los textos', '2. traducir con IA', '3. inyectarlos en el juego'],
    },
  },
  vision: {
    doLabel: 'Lo que hago',
    doText: ['Programas para Linux que alguien recién llegado pueda usar ', 'sin tutorial', ', y que a alguien con años en Linux no le estorben.'],
    goLabel: 'A dónde voy',
    goText: ['Que cuando alguien busque cómo hacer algo en Linux, una de las respuestas sea ', 'un programa mío', '.'],
    rules: [
      { title: 'El código siempre es público', text: 'Aunque el compilado esté en Patreon, el código está en GitHub.' },
      { title: 'Se cobra según el trabajo', text: 'Un script chico es gratis. Un programa grande va en un nivel más alto.' },
      { title: 'Se usa en Linux de verdad', text: 'Trabajo en Linux con Hyprland todos los días. Lo que publico corre en mi máquina.' },
      { title: 'Se puede pedir', text: 'Si te falta un programa o una función, me la puedes encargar.' },
    ],
  },
  channels: {
    eyebrow: 'Canales',
    title: ['También en ', 'YouTube', ''],
    lead: 'Son dos canales: uno para ver cómo se hacen los programas y otro para jugar. Más adelante quiero hacer streams, y quizá llegar a Bilibili.',
    items: [
      {
        role: 'Canal principal',
        text: 'Aquí se ve cómo avanzan los proyectos: código, diseño y bastante Hyprland, que es donde trabajo y estudio.',
        tags: ['Dev logs', 'Hyprland', 'Diseño'],
      },
      {
        role: 'Canal secundario',
        text: 'Gameplays, prototipos y mods, todo jugado en Linux. También es donde practico edición y narración antes de usarlas en el canal principal.',
        tags: ['Gameplays', 'Modding', 'Proton'],
      },
    ],
    cta: 'Ver canal',
  },
  footer: {
    title: ['¿Usas Linux o estás ', 'por probarlo?', ''],
    text: 'Revisa los repos, pásate por el canal y, si algo te sirvió, apóyalo en Patreon.',
  },
  marquee: [
    ['Linux', 'Proton', 'Open source', 'Gaming', 'Hyprland', 'Modding'],
    ['Gratis', 'Patreon', 'Comisiones', 'Mods', 'Traducciones'],
  ],
  project: {
    back: 'Todos los proyectos',
    github: 'Ver en GitHub',
    download: 'Descargar',
    patreon: 'Compilado en Patreon',
    readme: 'README',
    readmeLoading: 'Cargando el README…',
    readmeError: 'No se pudo cargar el README.',
    readmeOpen: 'Leerlo en GitHub',
    gallery: 'Capturas',
    prev: 'Anterior',
    next: 'Siguiente',
    notFound: 'No encontré ese proyecto',
    notFoundText: 'Puede que el repo haya cambiado de nombre o que ya no sea público.',
    backHome: 'Volver al inicio',
    noDescription: 'Proyecto en desarrollo.',
  },
  a11y: {
    open: 'Menú de accesibilidad',
    title: 'Accesibilidad',
    close: 'Cerrar',
    tabs: { reading: 'Lectura', vision: 'Visión', tools: 'Herramientas' },
    reader: 'Lector de voz',
    readerOn: 'Listo: haz clic en un texto para oírlo.',
    readerOff: 'Apagado',
    readerSpeaking: 'Leyendo…',
    readerUnsupported: 'Tu navegador no tiene lectura por voz.',
    enableReader: 'Activar lector de voz',
    readPage: 'Leer la página',
    readSelection: 'Leer lo seleccionado',
    stop: 'Detener',
    clickToRead: 'Leer al hacer clic',
    readFocus: 'Leer al navegar con teclado',
    fontSize: 'Tamaño del texto',
    contrast: 'Alto contraste',
    links: 'Resaltar enlaces',
    dyslexia: 'Fuente para dislexia',
    spacing: 'Más espacio entre letras',
    colorMode: 'Color',
    colors: { normal: 'Normal', monochrome: 'Monocromo', 'low-saturation': 'Saturación baja', 'high-saturation': 'Saturación alta' },
    bigCursor: 'Cursor grande',
    readingGuide: 'Guía de lectura',
    stopAnimations: 'Detener animaciones',
    toolsHint: 'La guía de lectura sigue al mouse y oscurece el resto de la pantalla.',
    reset: 'Restablecer ajustes',
    toTop: 'Volver arriba',
  },
}

const en: Dict = {
  meta: {
    title: 'NoctiVulp · Linux software',
    description:
      'Open source tools for people coming to Linux and for those who already use it every day. Desktop, gaming and modding.',
    locale: 'en_US',
  },
  skip: 'Skip to content',
  header: { status: 'Open for commissions', menu: 'Menu', close: 'Close', home: 'Home', otherLang: 'ES' },
  menu: {
    label: 'Main menu',
    items: {
      top: { label: 'Home', words: ['Linux', 'after dark'] },
      proyectos: { label: 'Projects', words: ['Open', 'source'] },
      'por-que-linux': { label: 'Why Linux', words: ['Bye', 'Windows 10'] },
      modelo: { label: 'Model', words: ['Free', 'or Patreon'] },
      vision: { label: 'What I do', words: ['No', 'tutorial'] },
      canales: { label: 'Channels', words: ['NoctiFox', 'Noctivulp'] },
    },
  },
  hero: {
    eyebrow: 'Linux · Proton · Modding',
    title: ['I make software so Linux feels ', 'less weird', ''],
    lead: "Small tools for people coming from Windows who don't want to fight the terminal, and bigger ones for people who already live in it. All the code is on GitHub.",
    cta: 'See projects',
    stats: { repos: 'Repositories', languages: 'Languages', open: 'Open source' },
  },
  work: {
    eyebrow: 'Projects',
    live: 'live from GitHub',
    offline: 'offline view',
    loading: 'Loading projects…',
    language: 'Language',
    stars: 'Stars',
    license: 'License',
    updated: 'Updated',
    viewProject: 'View project',
    cursor: 'View',
    navLabel: 'Go to a project',
  },
  index: { eyebrow: 'Index', title: ['All the ', 'repositories', ''], filterLabel: 'Filter projects', all: 'All' },
  categories: { linux: 'Linux desktop', gaming: 'Gaming & modding', apps: 'Apps', design: 'Design' },
  why: {
    eyebrow: 'Why Linux',
    title: ['More and more people ', 'are switching', ''],
    lead: 'And not just people who code. These are the reasons that keep coming up:',
    reasons: [
      {
        title: "Windows 11 won't run on your PC",
        text: 'Microsoft left out a ton of machines that work perfectly fine. Putting Linux on one of them is cheaper than buying a new one.',
      },
      {
        title: 'Games just run now',
        text: "Proton, Valve's compatibility layer built on Wine, runs a big chunk of the Steam catalog on Linux. Gaming used to be the excuse not to switch.",
      },
      {
        title: "Installing it isn't scary anymore",
        text: "Some distros install and feel almost like Windows. What's still hard to find is software that feels familiar, and that's where I come in.",
      },
    ],
  },
  model: {
    eyebrow: 'Model',
    title: ['How does this ', 'get paid', '?'],
    lead: "The code is free: you can read it, build it or fork it for non-commercial use, as long as you credit where it came from. What's on Patreon is the ready-to-install build.",
    tiers: [
      { name: 'Free', kicker: '$0', items: ['Small tools, ready to use', 'All the code on GitHub', 'You can build it yourself'] },
      {
        name: 'Patreon',
        kicker: 'Subscription',
        items: ['Official builds of every program', 'Bigger programs, higher tiers', 'It keeps the free code coming'],
      },
      {
        name: 'Commissions',
        kicker: 'Made to order',
        items: ['Get a program you already use to do something new or run on Linux', 'A program for your own problem', 'Game mods'],
      },
    ],
    patreonCta: 'Support on Patreon',
    side: {
      eyebrow: 'On the side',
      title: 'AI game translations',
      text: "A script pulls the text out of a game, runs it through an AI model and puts it back in. It isn't perfect, but it's enough to play things in Spanish that were never going to be translated.",
      steps: ['# how it works', '1. extract the text', '2. translate with AI', '3. inject it into the game'],
    },
  },
  vision: {
    doLabel: 'What I do',
    doText: ['Linux software that someone who just arrived can use ', 'without a tutorial', ", and that doesn't get in the way of someone with years on Linux."],
    goLabel: "Where I'm going",
    goText: ['When someone looks up how to do something on Linux, I want one of the answers to be ', 'one of my programs', '.'],
    rules: [
      { title: 'The code is always public', text: 'Even if the build is on Patreon, the code is on GitHub.' },
      { title: 'You pay for the work', text: 'A small script is free. A big program goes in a higher tier.' },
      { title: 'Used on real Linux', text: 'I work on Linux with Hyprland every day. What I publish runs on my machine.' },
      { title: 'You can ask for it', text: "If you're missing a program or a feature, you can commission it." },
    ],
  },
  channels: {
    eyebrow: 'Channels',
    title: ['Also on ', 'YouTube', ''],
    lead: 'Two channels: one to watch the software get made and one to play. Later on I want to stream, and maybe reach Bilibili.',
    items: [
      {
        role: 'Main channel',
        text: 'Where the projects move forward: code, design and plenty of Hyprland, which is where I work and study.',
        tags: ['Dev logs', 'Hyprland', 'Design'],
      },
      {
        role: 'Second channel',
        text: "Gameplays, prototypes and mods, all played on Linux. It's also where I practice editing and narration before using them on the main channel.",
        tags: ['Gameplays', 'Modding', 'Proton'],
      },
    ],
    cta: 'Watch channel',
  },
  footer: {
    title: ['Using Linux or ', 'about to try it?', ''],
    text: 'Check out the repos, drop by the channel and, if something helped you, support it on Patreon.',
  },
  marquee: [
    ['Linux', 'Proton', 'Open source', 'Gaming', 'Hyprland', 'Modding'],
    ['Free', 'Patreon', 'Commissions', 'Mods', 'Translations'],
  ],
  project: {
    back: 'All projects',
    github: 'View on GitHub',
    download: 'Download',
    patreon: 'Build on Patreon',
    readme: 'README',
    readmeLoading: 'Loading the README…',
    readmeError: "Couldn't load the README.",
    readmeOpen: 'Read it on GitHub',
    gallery: 'Screenshots',
    prev: 'Previous',
    next: 'Next',
    notFound: "Couldn't find that project",
    notFoundText: 'The repo may have been renamed or is no longer public.',
    backHome: 'Back home',
    noDescription: 'Work in progress.',
  },
  a11y: {
    open: 'Accessibility menu',
    title: 'Accessibility',
    close: 'Close',
    tabs: { reading: 'Reading', vision: 'Vision', tools: 'Tools' },
    reader: 'Voice reader',
    readerOn: 'Ready: click any text to hear it.',
    readerOff: 'Off',
    readerSpeaking: 'Reading…',
    readerUnsupported: "Your browser doesn't support speech.",
    enableReader: 'Turn on voice reader',
    readPage: 'Read the page',
    readSelection: 'Read selection',
    stop: 'Stop',
    clickToRead: 'Read on click',
    readFocus: 'Read on keyboard focus',
    fontSize: 'Text size',
    contrast: 'High contrast',
    links: 'Highlight links',
    dyslexia: 'Dyslexia-friendly font',
    spacing: 'Wider letter spacing',
    colorMode: 'Color',
    colors: { normal: 'Normal', monochrome: 'Monochrome', 'low-saturation': 'Low saturation', 'high-saturation': 'High saturation' },
    bigCursor: 'Big cursor',
    readingGuide: 'Reading guide',
    stopAnimations: 'Stop animations',
    toolsHint: 'The reading guide follows the mouse and dims the rest of the screen.',
    reset: 'Reset settings',
    toTop: 'Back to top',
  },
}

export const DICTS: Record<Lang, Dict> = { es, en }

export const LangContext = createContext<Lang>('es')

export function useLang() {
  return useContext(LangContext)
}

export function useT(): Dict {
  return DICTS[useContext(LangContext)]
}
