import { useSyncExternalStore } from 'react'
import { setMotionStopped } from './motion'

export type FontSize = 'normal' | 'large' | 'xlarge'
export type ColorMode = 'normal' | 'monochrome' | 'low-saturation' | 'high-saturation'

export interface A11ySettings {
  fontSize: FontSize
  colorMode: ColorMode
  highContrast: boolean
  highlightLinks: boolean
  dyslexiaFont: boolean
  textSpacing: boolean
  bigCursor: boolean
  readingGuide: boolean
  stopAnimations: boolean
  voiceReader: boolean
  clickToRead: boolean
  readFocus: boolean
}

export const DEFAULTS: A11ySettings = {
  fontSize: 'normal',
  colorMode: 'normal',
  highContrast: false,
  highlightLinks: false,
  dyslexiaFont: false,
  textSpacing: false,
  bigCursor: false,
  readingGuide: false,
  stopAnimations: false,
  voiceReader: false,
  clickToRead: true,
  readFocus: true,
}

const KEY = 'nv_a11y'

// Clase en <html> por cada ajuste booleano que cambia el aspecto.
const CLASSES: Partial<Record<keyof A11ySettings, string>> = {
  highContrast: 'high-contrast',
  highlightLinks: 'highlight-links-mode',
  dyslexiaFont: 'dyslexia-font',
  textSpacing: 'text-spacing-mode',
  bigCursor: 'big-cursor',
  stopAnimations: 'stop-animations-mode',
}

function load(): A11ySettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<A11ySettings>
    return { ...DEFAULTS, ...saved }
  } catch {
    return { ...DEFAULTS }
  }
}

let state = load()
const listeners = new Set<() => void>()

function apply() {
  const root = document.documentElement
  root.classList.remove('text-large', 'text-xlarge', 'color-monochrome', 'color-low-saturation', 'color-high-saturation')
  if (state.fontSize !== 'normal') root.classList.add(`text-${state.fontSize}`)
  if (state.colorMode !== 'normal') root.classList.add(`color-${state.colorMode}`)
  for (const [key, cls] of Object.entries(CLASSES)) root.classList.toggle(cls, Boolean(state[key as keyof A11ySettings]))
  setMotionStopped(state.stopAnimations)
}

export function initA11y() {
  apply()
}

export function updateA11y(patch: Partial<A11ySettings>) {
  state = { ...state, ...patch }
  const changed = Object.fromEntries(Object.entries(state).filter(([k, v]) => DEFAULTS[k as keyof A11ySettings] !== v))
  try {
    if (Object.keys(changed).length) localStorage.setItem(KEY, JSON.stringify(changed))
    else localStorage.removeItem(KEY)
  } catch {
    // sin almacenamiento: los ajustes duran hasta recargar
  }
  apply()
  listeners.forEach((l) => l())
}

export function resetA11y() {
  updateA11y(DEFAULTS)
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useA11y() {
  return useSyncExternalStore(subscribe, () => state)
}
