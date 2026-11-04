import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useT } from '../i18n'
import { resetA11y, updateA11y, useA11y, type A11ySettings, type ColorMode, type FontSize } from '../lib/a11y'
import {
  accessibleName,
  readableFromClick,
  readerSupported,
  readPage,
  readSelection,
  speakText,
  stopReading,
  useSpeaking,
} from '../lib/voiceReader'
import { AccessibilityIcon } from './Icons'

type BoolKey = { [K in keyof A11ySettings]: A11ySettings[K] extends boolean ? K : never }[keyof A11ySettings]

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'normal', label: 'A' },
  { value: 'large', label: 'A+' },
  { value: 'xlarge', label: 'A++' },
  { value: 'xxlarge', label: 'A+++' },
]
const COLOR_GROUPS: { id: string; modes: ColorMode[] }[] = [
  { id: 'color', modes: ['normal', 'monochrome', 'low-saturation', 'high-saturation', 'warm'] },
  { id: 'colorblind', modes: ['protanopia', 'deuteranopia', 'tritanopia'] },
]

// Corrección para daltonismo (daltonize): lo que no se distingue se pasa a otros canales.
const COLOR_BLIND_FILTERS: Record<string, string> = {
  protanopia: '1 0 0 0 0  0.4789 0.4769 0.0442 0 0  0.5973 -0.6887 1.0914 0 0  0 0 0 1 0',
  deuteranopia: '1.4366 -0.6314 0.1948 0 0  0 1 0 0 0  -0.1842 0.1863 0.9979 0 0  0 0 0 1 0',
  tritanopia: '0.7412 -0.4072 0.666 0 0  0.0751 0.5852 0.3397 0 0  0 0 1 0 0  0 0 0 1 0',
}

// Fila de configuración: toda la fila es el interruptor.
function Row({ label, setting, hint, disabled = false }: { label: string; setting: BoolKey; hint?: string; disabled?: boolean }) {
  const settings = useA11y()
  const on = settings[setting]
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      className={`a11y-row ${on ? 'is-on' : ''}`}
      onClick={() => updateA11y({ [setting]: !on })}
    >
      <span className="a11y-row__text">
        <span className="a11y-row__label">{label}</span>
        {hint && <span className="a11y-row__hint">{hint}</span>}
      </span>
      <span className="a11y-state" aria-hidden="true">
        {on ? 'on' : 'off'}
      </span>
    </button>
  )
}

// Con el lector encendido: leer el bloque de texto al que se le hace clic y lo que
// recibe el foco desde el teclado.
function useReaderListeners() {
  const { voiceReader, clickToRead, readFocus } = useA11y()

  useEffect(() => {
    if (!voiceReader || !clickToRead) return
    const onClick = (e: MouseEvent) => {
      const block = readableFromClick(e.target)
      if (block) speakText((block as HTMLElement).innerText, block)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [voiceReader, clickToRead])

  useEffect(() => {
    if (!voiceReader || !readFocus) return
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null
      if (!el?.matches?.(':focus-visible') || el.closest('[data-a11y-ui]')) return
      const name = accessibleName(el)
      if (name) speakText(name)
    }
    document.addEventListener('focusin', onFocus)
    return () => document.removeEventListener('focusin', onFocus)
  }, [voiceReader, readFocus])

  useEffect(() => {
    if (!voiceReader) stopReading()
  }, [voiceReader])
}

export function AccessibilityMenu() {
  const t = useT()
  const a = t.a11y
  const settings = useA11y()
  const speaking = useSpeaking()
  const [open, setOpen] = useState(false)
  // El cajón no existe en la página hasta la primera vez que se abre.
  const [mounted, setMounted] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useReaderListeners()

  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open, close])

  const toggle = () => {
    if (mounted) return setOpen((o) => !o)
    setMounted(true)
    // un frame cerrado para que la entrada se anime
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)))
  }

  const startReading = (action: () => void) => {
    if (!settings.voiceReader) updateA11y({ voiceReader: true })
    action()
  }

  const status = !readerSupported ? a.readerUnsupported : speaking ? a.readerSpeaking : settings.voiceReader ? a.readerOn : a.readerOff
  const readerOptionsDisabled = !readerSupported || !settings.voiceReader

  return (
    <div ref={rootRef} className="a11y" data-a11y-ui="">
      <svg className="a11y-filters" aria-hidden="true" focusable="false">
        {Object.entries(COLOR_BLIND_FILTERS).map(([id, values]) => (
          <filter key={id} id={`nv-${id}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={values} />
          </filter>
        ))}
      </svg>
      {mounted && (
        <>
          <div className={`a11y-scrim ${open ? 'is-open' : ''}`} aria-hidden="true" onClick={close} />
          <aside
            id="a11y-panel"
            role="dialog"
            aria-labelledby="a11y-title"
            className={`a11y-drawer ${open ? 'is-open' : ''}`}
            inert={!open}
          >
            <header className="a11y-drawer__bar">
              <span className="a11y-drawer__dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <div className="a11y-drawer__heading">
                <h2 id="a11y-title" className="a11y-drawer__title">
                  {a.title}
                </h2>
                <span className="a11y-drawer__path" aria-hidden="true">
                  ~/.config/noctivulp/a11y.conf
                </span>
              </div>
              <button ref={closeRef} type="button" className="a11y-key a11y-close" onClick={close} aria-label={a.close}>
                esc
              </button>
            </header>

            <div className="a11y-drawer__body">
              <section className="a11y-group" aria-labelledby="a11y-g-reading" style={{ '--i': 0 } as CSSProperties}>
                <h3 id="a11y-g-reading" className="a11y-group__title">
                  {a.tabs.reading}
                </h3>
                <Row label={a.reader} setting="voiceReader" hint={status} disabled={!readerSupported} />
                <div className="a11y-cmds">
                  <button type="button" className="a11y-cmd" disabled={!readerSupported} onClick={() => startReading(readPage)}>
                    <span aria-hidden="true">▸</span> {a.readPage}
                  </button>
                  <button type="button" className="a11y-cmd" disabled={!readerSupported} onClick={() => startReading(readSelection)}>
                    <span aria-hidden="true">▸</span> {a.readSelection}
                  </button>
                  <button type="button" className="a11y-cmd a11y-cmd--stop" disabled={!speaking} onClick={stopReading}>
                    <span aria-hidden="true">■</span> {a.stop}
                  </button>
                </div>
                <Row label={a.clickToRead} setting="clickToRead" disabled={readerOptionsDisabled} />
                <Row label={a.readFocus} setting="readFocus" disabled={readerOptionsDisabled} />
              </section>

              <section className="a11y-group" aria-labelledby="a11y-g-vision" style={{ '--i': 1 } as CSSProperties}>
                <h3 id="a11y-g-vision" className="a11y-group__title">
                  {a.tabs.vision}
                </h3>
                <div className="a11y-field">
                  <span className="a11y-row__label" id="a11y-size-label">
                    {a.fontSize}
                  </span>
                  <div className="a11y-keys" role="radiogroup" aria-labelledby="a11y-size-label">
                    {FONT_SIZES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={settings.fontSize === value}
                        className={`a11y-key ${settings.fontSize === value ? 'is-active' : ''}`}
                        onClick={() => updateA11y({ fontSize: value })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Row label={a.contrast} setting="highContrast" />
                <Row label={a.links} setting="highlightLinks" />
                <Row label={a.dyslexia} setting="dyslexiaFont" />
                <Row label={a.spacing} setting="textSpacing" />
                <Row label={a.headings} setting="highlightHeadings" />
                <Row label={a.alignLeft} setting="alignLeft" />
                {COLOR_GROUPS.map(({ id, modes }) => (
                  <div key={id} className="a11y-field a11y-field--stack">
                    <span className="a11y-row__text">
                      <span className="a11y-row__label" id={`a11y-${id}-label`}>
                        {id === 'color' ? a.colorMode : a.colorBlind}
                      </span>
                      <span className="a11y-row__hint">{modes.includes(settings.colorMode) ? a.colors[settings.colorMode] : '—'}</span>
                    </span>
                    <div className="a11y-swatches" role="radiogroup" aria-labelledby={`a11y-${id}-label`}>
                      {modes.map((value) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={settings.colorMode === value}
                          aria-label={a.colors[value]}
                          title={a.colors[value]}
                          className={`a11y-swatch a11y-swatch--${value} ${settings.colorMode === value ? 'is-active' : ''}`}
                          onClick={() => updateA11y({ colorMode: value })}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              <section className="a11y-group" aria-labelledby="a11y-g-tools" style={{ '--i': 2 } as CSSProperties}>
                <h3 id="a11y-g-tools" className="a11y-group__title">
                  {a.tabs.tools}
                </h3>
                <Row label={a.bigCursor} setting="bigCursor" />
                <Row label={a.readingGuide} setting="readingGuide" hint={a.toolsHint} />
                <Row label={a.stopAnimations} setting="stopAnimations" />
                <Row label={a.hideDecor} setting="hideDecorations" hint={a.hideDecorHint} />
                <Row label={a.strongFocus} setting="strongFocus" />
              </section>
            </div>

            <footer className="a11y-drawer__foot">
              <button type="button" className="a11y-reset" onClick={resetA11y}>
                <span aria-hidden="true">$</span> {a.reset}
              </button>
            </footer>
          </aside>
        </>
      )}

      <button
        ref={buttonRef}
        type="button"
        className="a11y-fab"
        onClick={toggle}
        aria-label={a.open}
        aria-expanded={open}
        aria-controls="a11y-panel"
      >
        <AccessibilityIcon />
      </button>
    </div>
  )
}
