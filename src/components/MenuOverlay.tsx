import { useEffect, useRef, useState, type RefObject } from 'react'
import { LINKS } from '../config'
import { useT, type Lang, type SectionId } from '../i18n'
import { gsap, lockScroll, useGSAP } from '../lib/motion'
import { homePath, navigate } from '../router'
import { ExternalButton } from './ExternalButton'
import { GithubIcon, PatreonIcon, YoutubeIcon } from './Icons'
import { MothLogo } from './MothLogo'

const SECTIONS: SectionId[] = ['top', 'proyectos', 'por-que-linux', 'modelo', 'vision', 'canales']

interface MenuOverlayProps {
  open: boolean
  onClose: () => void
  lang: Lang
  returnFocusRef: RefObject<HTMLButtonElement | null>
}

export function MenuOverlay({ open, onClose, lang, returnFocusRef }: MenuOverlayProps) {
  const t = useT()
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      tlRef.current = gsap
        .timeline({ paused: true })
        .set(rootRef.current, { visibility: 'visible' })
        .fromTo(
          '.menu__bg',
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' },
        )
        .from('.menu__link-text', { yPercent: 120, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, '-=0.35')
        .from('.menu__fade', { opacity: 0, y: 24, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, '<0.15')
    },
    { scope: rootRef },
  )

  useEffect(() => {
    const tl = tlRef.current
    if (!tl) return
    if (open) tl.timeScale(1).play()
    else tl.timeScale(1.7).reverse()
    lockScroll(open)
    if (!open) return

    const root = rootRef.current
    const menuBtn = returnFocusRef.current
    // foco al primer enlace cuando termina de entrar
    const focusTimer = window.setTimeout(() => root?.querySelector<HTMLElement>('.menu__link')?.focus(), 450)

    // Escape cierra; Tab queda atrapado entre el menú y el botón que lo cierra.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !root) return
      const focusables = [
        ...(menuBtn ? [menuBtn] : []),
        ...root.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      ]
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
      menuBtn?.focus()
    }
  }, [open, onClose, returnFocusRef])

  const go = (id: SectionId) => {
    onClose()
    window.setTimeout(() => navigate(homePath(lang, id === 'top' ? undefined : id)), 450)
  }

  return (
    <div ref={rootRef} id="menu" className="menu" aria-hidden={!open} inert={!open}>
      <div className="menu__bg" />
      <div className="container menu__inner">
        <nav className="menu__links" aria-label={t.menu.label}>
          {SECTIONS.map((id, i) => (
            <a
              key={id}
              href={homePath(lang, id === 'top' ? undefined : id)}
              className={`menu__link ${active === i ? 'is-active' : ''}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={(e) => {
                e.preventDefault()
                go(id)
              }}
            >
              <span className="menu__link-mask">
                <span className="menu__link-text">
                  <small>{String(i + 1).padStart(2, '0')}</small>
                  {t.menu.items[id].label}
                </span>
              </span>
            </a>
          ))}
        </nav>

        <div className="menu__preview menu__fade" aria-hidden="true">
          {SECTIONS.map((id, i) => (
            <div key={id} className={`menu__preview-item ${active === i ? 'is-active' : ''}`}>
              <MothLogo size={180} animated />
              <div className="menu__words">
                {t.menu.items[id].words.map((w) => (
                  <span key={w} className="menu__word-mask">
                    <span className="menu__word">{w}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="menu__footer">
          <div className="menu__fade menu__socials">
            <ExternalButton href={LINKS.github}>
              <GithubIcon /> GitHub
            </ExternalButton>
            <ExternalButton href={LINKS.youtube}>
              <YoutubeIcon /> YouTube
            </ExternalButton>
            <ExternalButton href={LINKS.patreon}>
              <PatreonIcon /> Patreon
            </ExternalButton>
          </div>
          <p className="menu__fade text-muted">{t.header.status}</p>
        </div>
      </div>
    </div>
  )
}
