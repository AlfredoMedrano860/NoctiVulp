import { useEffect, useRef } from 'react'

// Polilla Automeris io a dos tintas: alas delanteras triangulares, ocelos en las
// traseras, antenas plumosas y bigotes de zorro. Se dibuja la mitad izquierda y
// se refleja para la derecha.

function Wing() {
  return (
    <>
      {/* ala trasera con ocelo */}
      <path
        d="M31 31.2 C24.5 30.6 14 32.6 11.6 39.6 C9.8 45.3 13.4 51.6 19.6 52.6 C24.4 53.3 28.2 50 30.1 45.3 C31.2 41.8 31.3 36.8 31 31.2 Z"
        fill="var(--logo-b, var(--amber))"
      />
      <path d="M13.6 44.6 C14.2 48.4 16.9 50.6 20.2 50.8" stroke="var(--bg)" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.45" />
      <circle cx="20.4" cy="41.6" r="6" fill="var(--bg)" />
      <circle cx="20.4" cy="41.6" r="4.4" fill="var(--logo-a, var(--fire))" />
      <circle cx="20.4" cy="41.6" r="2.4" fill="var(--bg)" />
      <circle cx="19.5" cy="40.7" r="0.85" fill="var(--text)" />
      {/* ala delantera */}
      <path
        d="M30.6 24.6 C25 18.5 14 11 4.6 9.2 C3.4 9 2.6 10 3 11.2 C5 18 8.4 26 11.4 31.4 C12 32.4 13.2 32.8 14.3 32.4 C20 30.6 26 30 30.6 30.2 Z"
        fill="var(--logo-a, var(--fire))"
      />
      <path d="M7.2 24.5 C13.5 21.8 21 22.6 28.4 26.4" stroke="var(--bg)" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.5" />
      <circle cx="19" cy="20.6" r="1.3" fill="var(--bg)" opacity="0.55" />
    </>
  )
}

function Head() {
  return (
    <>
      {/* antena plumosa */}
      <path d="M31.2 19.6 C29.8 15.2 26.8 10.8 22.4 7.4 C23.3 10.2 25.6 14.6 30.2 20 Z" fill="var(--logo-b, var(--amber))" />
      {/* bigotes de zorro */}
      <path
        d="M30.1 22.4 L22.6 20.4 M30 23.3 L22.2 23.6 M30.2 24.2 L23 26.6"
        stroke="var(--text)"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.85"
      />
    </>
  )
}

const MIRROR = 'translate(64 0) scale(-1 1)'

interface MothLogoProps {
  size?: number
  className?: string
  // true: aletea mientras está en pantalla. 'hover': solo al pasar el cursor.
  animated?: boolean | 'hover'
}

export function MothLogo({ size = 40, className = '', animated = false }: MothLogoProps) {
  const ref = useRef<SVGSVGElement>(null)

  // Animar un <g> de SVG fuerza un layout por frame: solo aletea si se ve.
  useEffect(() => {
    const el = ref.current
    if (animated !== true || !el) return
    const io = new IntersectionObserver(([entry]) => el.classList.toggle('is-flapping', entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [animated])

  const mode = animated === 'hover' ? 'moth--hover' : animated ? 'moth--animated' : ''

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`moth ${mode} ${className}`}
      aria-hidden="true"
    >
      <g className="moth__wing">
        <Wing />
      </g>
      <g className="moth__wing">
        <g transform={MIRROR}>
          <Wing />
        </g>
      </g>
      <Head />
      <g transform={MIRROR}>
        <Head />
      </g>
      {/* cuerpo */}
      <ellipse cx="32" cy="39.5" rx="2.7" ry="9" fill="var(--text)" />
      <path d="M30 37 H34 M30 40.5 H34 M30.3 44 H33.7" stroke="var(--bg)" strokeWidth="0.6" opacity="0.35" />
      <circle cx="32" cy="27" r="3.6" fill="var(--text)" />
      <circle cx="32" cy="21.4" r="2.3" fill="var(--text)" />
      <circle cx="31.1" cy="21.2" r="0.55" fill="var(--bg)" />
      <circle cx="32.9" cy="21.2" r="0.55" fill="var(--bg)" />
    </svg>
  )
}
