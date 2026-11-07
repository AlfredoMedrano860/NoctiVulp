import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import type { ChatLink } from '../../data/chatKnowledge'
import type { Project } from '../../data/projects'
import { useLang, useT } from '../../i18n'
import { findReply } from '../../lib/chatbot'
import { homePath, navigate, projectPath } from '../../router'
import { MothLogo } from '../MothLogo'
import './chatbot.css'

// Chatbot "Nocti": un botón flotante abajo a la izquierda (gemelo del de accesibilidad)
// con la polilla del logo, y un panel con forma de ventana de terminal, como la línea
// "$ open github.com/…" del hero. Tus preguntas salen como comandos y las respuestas como
// la salida. Responde con data/chatKnowledge.ts y la lista real de proyectos, sin IA ni
// servidor (ver lib/chatbot.ts). Igual que el de ChainLedger:
//  - la primera vez aparece un aviso "¿Dudas? ¡Pregúntame!" (solo en pantallas grandes);
//  - Escape cierra el panel y devuelve el foco al botón;
//  - los mensajes nuevos se anuncian a lectores de pantalla (aria-live);
//  - las preguntas sugeridas se envían con un clic;
//  - en celular, tocar un enlace de una respuesta cierra el panel para ver la sección.

type ReplyLink = ChatLink | { project: string; label: string }

interface Message {
  id: number
  from: 'bot' | 'user'
  text: string
  link?: ReplyLink
}

// Tiempo que Nocti "piensa" (y aletea) antes de responder.
const THINK_MS = 550
const SEEN_KEY = 'nv_chat_seen'

function wasSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function ChatBot({ projects }: { projects: Project[] }) {
  const t = useT().chat
  const lang = useLang()
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(wasSeen)
  // Al cambiar de idioma App vuelve a montar el chat (key={lang}): empieza de nuevo en el idioma nuevo.
  const [messages, setMessages] = useState<Message[]>(() => [{ id: 0, from: 'bot', text: t.welcome }])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const nextId = useRef(1)
  const listRef = useRef<HTMLOListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const timer = useRef(0)
  const id = useId()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        launcherRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, thinking])

  const toggle = () => {
    setOpen((o) => !o)
    if (!seen) {
      setSeen(true)
      try {
        localStorage.setItem(SEEN_KEY, '1')
      } catch {
        // sin almacenamiento: el aviso vuelve a salir en la próxima visita
      }
    }
  }

  const ask = (question: string) => {
    const text = question.trim()
    if (!text || thinking) return
    setMessages((m) => [...m, { id: nextId.current++, from: 'user', text }])
    setInput('')
    setThinking(true)
    timer.current = window.setTimeout(() => {
      const reply = findReply(text, lang, projects)
      setMessages((m) => [...m, { id: nextId.current++, from: 'bot', text: reply ? reply.text : t.fallback, link: reply?.link }])
      setThinking(false)
    }, THINK_MS)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    ask(input)
  }

  const linkTarget = (link: ReplyLink) => {
    if ('project' in link) return { href: projectPath(lang, link.project), label: link.label, external: false }
    if ('section' in link) return { href: homePath(lang, link.section), label: link.label[lang], external: false }
    return { href: link.href, label: link.label[lang], external: true }
  }

  // Enlaces internos: navegan sin recargar; en celular además cierran el panel.
  const onInternalLink = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (window.matchMedia('(max-width: 560px)').matches) setOpen(false)
    navigate(href)
  }

  return (
    <div className="chat">
      {open && (
        <div className="chat__panel" role="dialog" aria-labelledby={`${id}-title`}>
          <header className="chat__bar">
            <span className="chat__dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <h2 id={`${id}-title`} className="chat__title">
              <MothLogo size={20} animated="hover" className={`chat__moth ${thinking ? 'is-thinking' : ''}`} />
              {t.title}
              <span className="chat__path">{t.eyebrow}</span>
            </h2>
            <button type="button" className="chat__close" onClick={toggle} aria-label={t.close}>
              <CloseIcon size={18} />
            </button>
          </header>

          <ol ref={listRef} className="chat__log" aria-live="polite" aria-label={t.conversation}>
            {messages.map((m) => {
              const link = m.link && linkTarget(m.link)
              return (
                <li key={m.id} className={`chat__line chat__line--${m.from}`}>
                  <span className="sr-only">{m.from === 'bot' ? t.botSays : t.youSaid}</span>
                  {m.from === 'user' ? (
                    <p>
                      <span className="chat__prompt" aria-hidden="true">
                        $
                      </span>{' '}
                      {m.text}
                    </p>
                  ) : (
                    <p>{m.text}</p>
                  )}
                  {link &&
                    (link.external ? (
                      <a className="chat__link" href={link.href} target="_blank" rel="noopener noreferrer">
                        → {link.label}
                      </a>
                    ) : (
                      <a className="chat__link" href={link.href} onClick={(e) => onInternalLink(e, link.href)}>
                        → {link.label}
                      </a>
                    ))}
                </li>
              )
            })}
            {thinking && (
              <li className="chat__line chat__line--bot chat__typing" aria-label={t.typing}>
                <span className="caret" aria-hidden="true" />
              </li>
            )}
          </ol>

          <div className="chat__suggestions" role="group" aria-label={t.suggestionsLabel}>
            {t.suggestions.map((s) => (
              <button key={s} type="button" onClick={() => ask(s)} disabled={thinking}>
                {s}
              </button>
            ))}
          </div>

          <form className="chat__form" onSubmit={onSubmit}>
            <span className="chat__prompt" aria-hidden="true">
              $
            </span>
            <label className="sr-only" htmlFor={`${id}-input`}>
              {t.inputLabel}
            </label>
            <input
              ref={inputRef}
              id={`${id}-input`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              autoComplete="off"
              spellCheck={false}
              maxLength={200}
            />
            <button type="submit" disabled={!input.trim() || thinking} aria-label={t.send}>
              <SendIcon />
            </button>
          </form>
        </div>
      )}

      {!open && !seen && (
        <p className="chat__hint" aria-hidden="true">
          {t.bubble}
        </p>
      )}

      <button
        ref={launcherRef}
        type="button"
        className={`chat__launcher ${open ? 'is-open' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? t.closeLauncher : t.openLauncher}
      >
        {open ? <CloseIcon /> : <MothLogo size={30} animated="hover" />}
      </button>
    </div>
  )
}
