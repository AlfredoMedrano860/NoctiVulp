import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { prefersReducedMotion, scrollToTarget } from '../lib/motion'
import { ChevronUpIcon } from './Icons'

export function BackToTop() {
  const t = useT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      className={`to-top ${visible ? 'is-visible' : ''}`}
      onClick={() => scrollToTarget(0, prefersReducedMotion(), 1.4, true)}
      aria-label={t.a11y.toTop}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <ChevronUpIcon size={22} />
    </button>
  )
}
