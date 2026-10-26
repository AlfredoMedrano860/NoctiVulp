import type { ReactNode } from 'react'
import { isSafeUrl } from '../lib/url'

interface ExternalButtonProps {
  href: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
  cursor?: string
}

// Si el enlace aún no existe (o no es válido), el botón no se muestra.
export function ExternalButton({ href, children, variant = 'ghost', cursor }: ExternalButtonProps) {
  if (!isSafeUrl(href)) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`btn btn--${variant}`} data-cursor={cursor}>
      {children}
    </a>
  )
}
