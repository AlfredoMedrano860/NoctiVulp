import type { AnchorHTMLAttributes } from 'react'
import { handleLinkClick } from '../router'

// <a> interno: navega con el router sin recargar la página.
export function Link({ to, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e)
        handleLinkClick(e, to)
      }}
      {...rest}
    />
  )
}
