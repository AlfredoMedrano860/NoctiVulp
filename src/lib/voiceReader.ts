import { useSyncExternalStore } from 'react'

const READABLE = 'h1, h2, h3, h4, p, li, dt, dd, blockquote, figcaption, .tag, .eyebrow'
const HIGHLIGHT = 'a11y-reading-highlight'

export const readerSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

let speaking = false
let current: Element | null = null
let session = 0
const listeners = new Set<() => void>()

function setSpeaking(value: boolean) {
  if (speaking === value) return
  speaking = value
  listeners.forEach((l) => l())
}

function highlight(el: Element | null) {
  current?.classList.remove(HIGHLIGHT)
  current = el
  el?.classList.add(HIGHLIGHT)
}

const voiceLang = () => (document.documentElement.lang === 'en' ? 'en-US' : 'es-ES')

const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

function isHidden(el: Element) {
  if (el.closest('[aria-hidden="true"], [inert], [data-a11y-ui], .sr-only')) return true
  const rect = el.getBoundingClientRect()
  return rect.width === 0 && rect.height === 0
}

export function stopReading() {
  session++
  if (readerSupported) window.speechSynthesis.cancel()
  highlight(null)
  setSpeaking(false)
}

// Lee los fragmentos uno por uno, resaltando el elemento que se está leyendo.
function speak(parts: { el: Element | null; text: string }[]) {
  stopReading()
  if (!readerSupported || !parts.length) return
  const id = session
  const lang = voiceLang()
  const next = (i: number) => {
    if (id !== session) return
    const part = parts[i]
    if (!part) {
      highlight(null)
      setSpeaking(false)
      return
    }
    const u = new SpeechSynthesisUtterance(part.text)
    u.lang = lang
    u.onstart = () => {
      if (id !== session) return
      highlight(part.el)
      const rect = part.el?.getBoundingClientRect()
      if (rect && (rect.top < 0 || rect.bottom > window.innerHeight)) part.el?.scrollIntoView({ block: 'center' })
    }
    u.onend = () => next(i + 1)
    u.onerror = () => next(i + 1)
    window.speechSynthesis.speak(u)
  }
  setSpeaking(true)
  next(0)
}

export function speakText(text: string, el: Element | null = null) {
  const value = clean(text)
  if (value) speak([{ el, text: value }])
}

// Desde lo que se ve en pantalla hasta el final de la página.
export function readPage() {
  const root = document.getElementById('main') ?? document.body
  const all = Array.from(root.querySelectorAll(READABLE)).concat(Array.from(document.querySelectorAll('footer :is(' + READABLE + ')')))
  const parts = all
    .filter((el) => !isHidden(el) && !el.querySelector(READABLE) && el.getBoundingClientRect().bottom > 0)
    .map((el) => ({ el, text: clean((el as HTMLElement).innerText) }))
    .filter((p) => p.text)
  speak(parts)
}

export function readSelection() {
  const text = window.getSelection()?.toString() ?? ''
  if (clean(text)) speakText(text)
}

// Al hacer clic en un texto, se lee ese bloque.
export function readableFromClick(target: EventTarget | null) {
  const el = target instanceof Element ? target : null
  if (!el || el.closest('a, button, input, textarea, select, [data-a11y-ui]')) return null
  const block = el.closest(READABLE)
  return block && !isHidden(block) ? block : null
}

export function accessibleName(el: HTMLElement) {
  return clean(el.getAttribute('aria-label') ?? (el.innerText || el.getAttribute('title') || el.getAttribute('alt') || ''))
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useSpeaking() {
  return useSyncExternalStore(subscribe, () => speaking)
}
