import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ART_SIZES, type ArtKind } from '../lib/paint/sizes'
import { paintArtBlob } from '../lib/paint/paintClient'

const painted = new Map<ArtKind, Promise<string | null>>()

function paintOnce(kind: ArtKind) {
  let url = painted.get(kind)
  if (!url) {
    url = paintArtBlob(kind).then((blob) => (blob ? URL.createObjectURL(blob) : null))
    painted.set(kind, url)
  }
  return url
}

export function PaintedArt({ kind, className = '', style }: { kind: ArtKind; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLImageElement>(null)
  const [src, setSrc] = useState<string>()
  const [done, setDone] = useState(false)
  const [w, h] = ART_SIZES[kind]

  useEffect(() => {
    const img = ref.current
    if (!img) return
    let cancelled = false
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const url = await paintOnce(kind)
        if (url && !cancelled) setSrc(url)
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(img)
    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [kind])

  return (
    <img
      ref={ref}
      src={src}
      width={w}
      height={h}
      alt=""
      decoding="async"
      draggable={false}
      onLoad={() => requestAnimationFrame(() => setDone(true))}
      className={`painted-art painted-art--${kind} ${done ? 'is-done' : ''} ${className}`}
      aria-hidden="true"
      style={{ aspectRatio: `${w} / ${h}`, ...style }}
    />
  )
}
