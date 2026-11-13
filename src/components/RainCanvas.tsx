import { useEffect, useRef } from 'react'
import { firstInteraction } from '../lib/interaction'

const TILE = 512

// [opacidad, gotas por mosaico, segundos por vuelta]: las tenues caen lento y las brillantes rápido.
const RAIN_LAYERS: [number, number, number][] = [
  [0.1, 8, 1.25],
  [0.18, 7, 0.85],
  [0.28, 6, 0.6],
]
const EMBERS_PER_TILE = 5

const svgUrl = (body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${TILE}' height='${TILE}'>${body}</svg>`)}")`

const round = (n: number) => Math.round(n * 10) / 10

// Cada gota se dibuja también en las copias vecinas para que el mosaico empalme sin cortes.
function rainTile(alpha: number, count: number) {
  let d = ''
  for (let i = 0; i < count; i++) {
    const x = Math.random() * TILE
    const y = Math.random() * TILE
    const len = 12 + Math.random() * 28
    for (const dx of [-TILE, 0, TILE]) {
      for (const dy of [-TILE, 0, TILE]) {
        d += `M${round(x + dx)} ${round(y + dy)}l${round(-len * 0.25)} ${round(len)}`
      }
    }
  }
  return svgUrl(`<path d='${d}' stroke='rgb(255,179,71)' stroke-opacity='${alpha}' stroke-width='1' stroke-linecap='round' fill='none'/>`)
}

function emberTile() {
  let dots = ''
  for (let i = 0; i < EMBERS_PER_TILE; i++) {
    const x = round(20 + Math.random() * (TILE - 40))
    const y = round(20 + Math.random() * (TILE - 40))
    const r = round((0.6 + Math.random() * 1.8) * 4)
    dots += `<circle cx='${x}' cy='${y}' r='${r}' fill='url(#g)' opacity='${round(0.35 + Math.random() * 0.45)}'/>`
  }
  return svgUrl(
    `<defs><radialGradient id='g'><stop offset='0' stop-color='rgb(255,200,140)'/><stop offset='0.2' stop-color='rgb(255,107,0)' stop-opacity='0.9'/><stop offset='1' stop-color='rgb(255,107,0)' stop-opacity='0'/></radialGradient></defs>${dots}`,
  )
}

// Lluvia nocturna con brasas que suben. Los mosaicos son SVG (sin canvas: nada que leer de la
// GPU) y se mueven con animaciones CSS de transform, que hace la GPU sin tocar el hilo principal.
export function RainCanvas() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    let cancelled = false

    const build = () => {
      if (cancelled) return
      const tiles = [...RAIN_LAYERS.map(([alpha, count]) => rainTile(alpha, count)), emberTile()]
      root.querySelectorAll<HTMLElement>('.rain__layer').forEach((layer, i) => {
        layer.style.backgroundImage = tiles[i]
      })
      root.classList.add('is-ready')
    }

    // En pantallas chicas la lluvia espera a la primera interacción: no compite con la carga.
    const hasIdle = typeof requestIdleCallback === 'function'
    let idle: number | ReturnType<typeof setTimeout> = 0
    const schedule = () => {
      if (cancelled) return
      idle = hasIdle ? requestIdleCallback(build, { timeout: 3000 }) : setTimeout(build, 1500)
    }
    if (window.innerWidth < 760 || window.matchMedia('(pointer: coarse)').matches) void firstInteraction.then(schedule)
    else schedule()

    return () => {
      cancelled = true
      if (hasIdle) cancelIdleCallback(idle as number)
      else clearTimeout(idle)
    }
  }, [])

  return (
    <div ref={ref} className="rain-canvas" aria-hidden="true">
      {RAIN_LAYERS.map(([, , seconds], i) => (
        <div key={i} className="rain__layer rain__layer--drops" style={{ animationDuration: `${seconds}s` }} />
      ))}
      <div className="rain__layer rain__layer--embers" />
    </div>
  )
}
