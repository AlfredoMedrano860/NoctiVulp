import { useState, type CSSProperties } from 'react'
import { ART_SIZES, type ArtKind } from '../lib/paint/sizes'

// Ilustración pintada a mano. Se generan una vez con `npm run paint` y viven en public/paint.
export function PaintedArt({ kind, className = '', style }: { kind: ArtKind; className?: string; style?: CSSProperties }) {
  const [done, setDone] = useState(false)
  const [w, h] = ART_SIZES[kind]

  return (
    <img
      src={`/paint/art-${kind}.webp`}
      width={w}
      height={h}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onLoad={() => setDone(true)}
      className={`painted-art painted-art--${kind} ${done ? 'is-done' : ''} ${className}`}
      aria-hidden="true"
      style={{ aspectRatio: `${w} / ${h}`, ...style }}
    />
  )
}
