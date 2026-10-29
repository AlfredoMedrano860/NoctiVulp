import { forwardRef, useRef } from 'react'
import { useT, type Lang } from '../i18n'
import { ScrollTrigger, useGSAP } from '../lib/motion'
import { homePath, switchLangPath, type Route } from '../router'
import { Link } from './Link'
import { MothLogo } from './MothLogo'

interface HeaderProps {
  open: boolean
  onToggle: () => void
  route: Route
}

export const Header = forwardRef<HTMLButtonElement, HeaderProps>(function Header({ open, onToggle, route }, menuBtnRef) {
  const t = useT()
  const ref = useRef<HTMLElement>(null)
  const otherLang: Lang = route.lang === 'es' ? 'en' : 'es'

  // Se esconde al bajar y reaparece al subir.
  useGSAP(() => {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const el = ref.current
        if (!el) return
        el.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 240)
        el.classList.toggle('is-scrolled', self.scroll() > 40)
      },
    })
  })

  return (
    <header ref={ref} className={`header ${open ? 'is-open' : ''}`}>
      <div className="container header__inner">
        <Link to={homePath(route.lang)} className="brand" aria-label={`NoctiVulp · ${t.header.home}`}>
          <MothLogo size={34} animated="hover" />
          <span>
            Nocti<span className="text-fire">Vulp</span>
          </span>
        </Link>

        <p className="header__status">
          <span className="pulse" /> {t.header.status}
        </p>

        <div className="header__actions">
          <Link
            to={switchLangPath(route, otherLang)}
            className="lang-btn"
            hrefLang={otherLang}
            lang={otherLang}
            aria-label={`${t.header.otherLang}, ${otherLang === 'en' ? 'English' : 'Español'}`}
          >
            {t.header.otherLang}
          </Link>
          <button ref={menuBtnRef} className="menu-btn" aria-expanded={open} aria-controls="menu" onClick={onToggle}>
            <span className="menu-btn__label">
              <span className="menu-btn__track">
                <span>{t.header.menu}</span>
                <span>{t.header.close}</span>
              </span>
            </span>
            <span className="menu-btn__icon" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>
    </header>
  )
})
