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
    log: { updated: string; on: string; repos: string }
    githubProfile: string
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
    soon: string
  }
  footer: { title: Highlighted; text: string }
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
    colors: {
      normal: string
      monochrome: string
      'low-saturation': string
      'high-saturation': string
      warm: string
      protanopia: string
      deuteranopia: string
      tritanopia: string
    }
    colorBlind: string
    headings: string
    hideDecor: string
    hideDecorHint: string
    strongFocus: string
    alignLeft: string
    bigCursor: string
    readingGuide: string
    stopAnimations: string
    toolsHint: string
    reset: string
    toTop: string
  }
}

// Cada idioma es un módulo aparte: la página descarga solo el suyo. El HTML estático de
// cada idioma ya trae la precarga de su diccionario (ver vite.config.ts).
const LOADERS: Record<Lang, () => Promise<{ default: Dict }>> = {
  es: () => import('./locales/es.ts'),
  en: () => import('./locales/en.ts'),
}

const loaded: Partial<Record<Lang, Dict>> = {}
const pending: Partial<Record<Lang, Promise<Dict>>> = {}

export function loadDict(lang: Lang): Promise<Dict> {
  const ready = loaded[lang]
  if (ready) return Promise.resolve(ready)
  pending[lang] ??= LOADERS[lang]().then((m) => (loaded[lang] = m.default))
  return pending[lang]
}

// Solo para idiomas ya cargados (el de la página se carga antes de dibujar).
export function getDict(lang: Lang): Dict {
  const dict = loaded[lang]
  if (!dict) throw new Error(`Diccionario "${lang}" sin cargar`)
  return dict
}

export const LangContext = createContext<Lang>('es')

export function useLang() {
  return useContext(LangContext)
}

export function useT(): Dict {
  return getDict(useContext(LangContext))
}
