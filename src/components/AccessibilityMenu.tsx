import { useCallback, useEffect, useRef, useState } from 'react'
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
import { AccessibilityIcon, LineIcon, type LineIconName } from './Icons'

type Tab = 'reading' | 'vision' | 'tools'
type BoolKey = { [K in keyof A11ySettings]: A11ySettings[K] extends boolean ? K : never }[keyof A11ySettings]

const TABS: Tab[] = ['reading', 'vision', 'tools']
const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'normal', label: 'A' },
  { value: 'large', label: 'A+' },
  { value: 'xlarge', label: 'A++' },
]
const COLOR_MODES: ColorMode[] = ['normal', 'monochrome', 'low-saturation', 'high-saturation']

function Toggle({ label, icon, setting, disabled = false }: { label: string; icon: LineIconName; setting: BoolKey; disabled?: boolean }) {
  const settings = useA11y()
  return (
    <label className={`a11y-toggle ${disabled ? 'is-disabled' : ''}`}>
      <span className="a11y-toggle__top">
        <span className="a11y-toggle__icon">
          <LineIcon name={icon} size={18} />
        </span>
        <input
          type="checkbox"
          className="a11y-switch"
          checked={settings[setting]}
          disabled={disabled}
          onChange={() => updateA11y({ [setting]: !settings[setting] })}
        />
      </span>
      <span className="a11y-toggle__label">{label}</span>
    </label>
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
  const [tab, setTab] = useState<Tab>('reading')
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  useReaderListeners()

  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
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

  const startReading = (action: () => void) => {
    if (!settings.voiceReader) updateA11y({ voiceReader: true })
    action()
  }

  const status = !readerSupported ? a.readerUnsupported : speaking ? a.readerSpeaking : settings.voiceReader ? a.readerOn : a.readerOff
  const readerOptionsDisabled = !readerSupported || !settings.voiceReader

  return (
    <div ref={rootRef} className="a11y" data-a11y-ui="">
      <div
        id="a11y-panel"
        role="dialog"
        aria-label={a.title}
        className={`a11y-panel ${open ? 'is-open' : ''}`}
        inert={!open}
        data-lenis-prevent=""
      >
        <div className="a11y-panel__head">
          <h2 className="a11y-panel__title">{a.title}</h2>
          <button type="button" className="a11y-close" onClick={close} aria-label={a.close}>
            <LineIcon name="close" size={18} />
          </button>
        </div>

        <div className="a11y-tabs" role="tablist" aria-label={a.title}>
          {TABS.map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`a11y-tab-${value}`}
              aria-selected={tab === value}
              aria-controls={`a11y-tabpanel-${value}`}
              className={`a11y-pill ${tab === value ? 'is-active' : ''}`}
              onClick={() => setTab(value)}
            >
              {a.tabs[value]}
            </button>
          ))}
        </div>

        <div className="a11y-panel__body">
          {tab === 'reading' && (
            <section role="tabpanel" id="a11y-tabpanel-reading" aria-labelledby="a11y-tab-reading">
              <div className="a11y-card">
                <div className="a11y-reader">
                  <span className="a11y-toggle__icon">
                    <LineIcon name="audio" size={18} />
                  </span>
                  <span className="a11y-reader__text">
                    <span className="a11y-reader__title">{a.reader}</span>
                    <span className="a11y-reader__status" role="status">
                      {status}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="a11y-switch"
                    aria-label={a.enableReader}
                    checked={settings.voiceReader}
                    disabled={!readerSupported}
                    onChange={() => updateA11y({ voiceReader: !settings.voiceReader })}
                  />
                </div>
                <div className="a11y-reader__actions">
                  <button type="button" className="a11y-action" disabled={!readerSupported} onClick={() => startReading(readPage)}>
                    <LineIcon name="page" size={16} /> {a.readPage}
                  </button>
                  <button type="button" className="a11y-action" disabled={!readerSupported} onClick={() => startReading(readSelection)}>
                    <LineIcon name="click" size={16} /> {a.readSelection}
                  </button>
                  <button type="button" className="a11y-action a11y-action--stop" disabled={!speaking} onClick={stopReading}>
                    <LineIcon name="stop" size={16} /> {a.stop}
                  </button>
                </div>
              </div>
              <div className="a11y-grid">
                <Toggle label={a.clickToRead} icon="pointer" setting="clickToRead" disabled={readerOptionsDisabled} />
                <Toggle label={a.readFocus} icon="focus" setting="readFocus" disabled={readerOptionsDisabled} />
              </div>
            </section>
          )}

          {tab === 'vision' && (
            <section role="tabpanel" id="a11y-tabpanel-vision" aria-labelledby="a11y-tab-vision">
              <span className="a11y-label">{a.fontSize}</span>
              <div className="a11y-choices a11y-choices--3" role="radiogroup" aria-label={a.fontSize}>
                {FONT_SIZES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={settings.fontSize === value}
                    className={`a11y-pill ${settings.fontSize === value ? 'is-active' : ''}`}
                    onClick={() => updateA11y({ fontSize: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="a11y-grid">
                <Toggle label={a.contrast} icon="eye" setting="highContrast" />
                <Toggle label={a.links} icon="link" setting="highlightLinks" />
                <Toggle label={a.dyslexia} icon="type" setting="dyslexiaFont" />
                <Toggle label={a.spacing} icon="spacing" setting="textSpacing" />
              </div>
              <span className="a11y-label">{a.colorMode}</span>
              <div className="a11y-choices" role="radiogroup" aria-label={a.colorMode}>
                {COLOR_MODES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={settings.colorMode === value}
                    className={`a11y-pill ${settings.colorMode === value ? 'is-active' : ''}`}
                    onClick={() => updateA11y({ colorMode: value })}
                  >
                    {a.colors[value]}
                  </button>
                ))}
              </div>
            </section>
          )}

          {tab === 'tools' && (
            <section role="tabpanel" id="a11y-tabpanel-tools" aria-labelledby="a11y-tab-tools">
              <div className="a11y-grid a11y-grid--flush">
                <Toggle label={a.bigCursor} icon="pointer" setting="bigCursor" />
                <Toggle label={a.readingGuide} icon="book" setting="readingGuide" />
                <Toggle label={a.stopAnimations} icon="pause" setting="stopAnimations" />
              </div>
              <p className="a11y-hint">{a.toolsHint}</p>
            </section>
          )}
        </div>

        <button type="button" className="a11y-reset" onClick={resetA11y}>
          {a.reset}
        </button>
      </div>

      <button
        ref={buttonRef}
        type="button"
        className="a11y-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={a.open}
        aria-expanded={open}
        aria-controls="a11y-panel"
      >
        <AccessibilityIcon />
      </button>
    </div>
  )
}
