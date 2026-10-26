import { useEffect, useRef, useState } from 'react'

// Ciudad nocturna bajo la lluvia "al óleo": se pinta una sola vez con pinceladas
// de color variable, por capas y en tiempo libre. Va detrás de la lluvia animada.

const W = 960
const H = 540
const HORIZON = H * 0.66

type Rand = () => number

function seeded(seed: number): Rand {
  let s = seed >>> 0
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Color con variación aleatoria, como la pintura que nunca queda pareja.
function jitter(rand: Rand, hex: string, amount = 14) {
  const [r, g, b] = hexToRgb(hex)
  const j = () => (rand() - 0.5) * 2 * amount
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + j())))
  return `rgb(${c(r)}, ${c(g)}, ${c(b)})`
}

function lerpColor(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const m = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `#${[m(r1, r2), m(g1, g2), m(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

// Pincelada: forma alargada con bordes irregulares y un brillo de empaste arriba.
function brush(
  ctx: CanvasRenderingContext2D,
  rand: Rand,
  x: number,
  y: number,
  len: number,
  width: number,
  angle: number,
  color: string,
  alpha: number,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  const hw = width / 2
  ctx.beginPath()
  ctx.moveTo(-len / 2, 0)
  ctx.quadraticCurveTo(-len / 2, -hw, 0, -hw * (0.75 + rand() * 0.5))
  ctx.quadraticCurveTo(len / 2, -hw, len / 2, 0)
  ctx.quadraticCurveTo(len / 2, hw, 0, hw * (0.75 + rand() * 0.5))
  ctx.quadraticCurveTo(-len / 2, hw, -len / 2, 0)
  ctx.fill()
  if (width > 3) {
    ctx.globalAlpha = alpha * 0.22
    ctx.strokeStyle = 'rgba(255, 230, 200, 1)'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(-len * 0.38, -hw * 0.45)
    ctx.lineTo(len * 0.38, -hw * 0.55)
    ctx.stroke()
  }
  ctx.restore()
}

interface Light {
  x: number
  y: number
  w: number
  color: string
  strength: number
}

const nextIdle = () =>
  new Promise<void>((resolve) => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout: 300 })
    else setTimeout(resolve, 16)
  })

async function paintCity(canvas: HTMLCanvasElement, isCancelled: () => boolean) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  const rand = seeded(20261026)
  const lights: Light[] = []

  // 1. cielo: de noche casi negra a un rojo vino iluminado por la ciudad
  for (let y = 0; y < HORIZON + 20; y += 5) {
    const t = y / HORIZON
    const base = t < 0.6 ? lerpColor('#0c090e', '#2a0f16', t / 0.6) : lerpColor('#2a0f16', '#5e1c1a', (t - 0.6) / 0.4)
    for (let x = -20; x < W + 20; x += 18 + rand() * 20) {
      brush(ctx, rand, x, y + rand() * 4, 40 + rand() * 50, 9 + rand() * 6, (rand() - 0.5) * 0.12, jitter(rand, base, 6), 0.85)
    }
  }
  // resplandor naranja de la ciudad sobre el horizonte
  for (let i = 0; i < 260; i++) {
    const x = W * (0.35 + rand() * 0.6)
    const y = HORIZON - rand() * rand() * H * 0.35
    brush(ctx, rand, x, y, 30 + rand() * 60, 8 + rand() * 10, (rand() - 0.5) * 0.2, jitter(rand, rand() > 0.5 ? '#ff6b00' : '#e63946', 20), 0.06 + rand() * 0.06)
  }
  await nextIdle()
  if (isCancelled()) return false

  // 2. edificios en tres planos: lejos (con bruma), medio y cerca
  const layers = [
    { color: '#3a1a1e', minH: 0.18, maxH: 0.36, minW: 22, maxW: 52, windows: 0.14, glow: 0.35 },
    { color: '#1f1013', minH: 0.26, maxH: 0.5, minW: 34, maxW: 78, windows: 0.26, glow: 0.7 },
  ]
  for (const layer of layers) {
    let x = -10
    while (x < W + 10) {
      const bw = layer.minW + rand() * (layer.maxW - layer.minW)
      const bh = H * (layer.minH + rand() * (layer.maxH - layer.minH))
      const top = HORIZON - bh
      ctx.globalAlpha = 1
      ctx.fillStyle = layer.color
      ctx.fillRect(x, top, bw, bh + 4)
      // textura vertical del edificio
      for (let sx = x + 3; sx < x + bw; sx += 5 + rand() * 3) {
        brush(ctx, rand, sx, top + bh / 2, bh, 4 + rand() * 3, Math.PI / 2 + (rand() - 0.5) * 0.03, jitter(rand, layer.color, 8), 0.5)
      }
      // ventanas encendidas
      for (let wy = top + 8; wy < HORIZON - 6; wy += 8 + rand() * 5) {
        for (let wx = x + 5; wx < x + bw - 5; wx += 7 + rand() * 4) {
          if (rand() > layer.windows) continue
          const warm = rand() > 0.25 ? '#ffb347' : '#ff6b00'
          brush(ctx, rand, wx + (rand() - 0.5) * 2, wy, 3 + rand() * 3, 2.5 + rand() * 1.5, (rand() - 0.5) * 0.2, jitter(rand, warm, 30), layer.glow * (0.4 + rand() * 0.6))
          if (rand() > 0.85) lights.push({ x: wx, y: wy, w: 3, color: warm, strength: layer.glow * 0.5 })
        }
      }
      // letrero de neón vertical
      if (rand() > 0.72 && bh > H * 0.25) {
        const nx = x + bw * (0.2 + rand() * 0.6)
        const ny = top + bh * (0.15 + rand() * 0.3)
        const nh = 26 + rand() * 40
        const neon = rand() > 0.5 ? '#ff6b00' : '#e63946'
        ctx.save()
        ctx.shadowColor = neon
        ctx.shadowBlur = 18
        brush(ctx, rand, nx, ny + nh / 2, nh, 6, Math.PI / 2, neon, 0.9)
        ctx.restore()
        lights.push({ x: nx, y: ny + nh / 2, w: 6, color: neon, strength: 1 })
      }
      x += bw + rand() * 6
    }
    // bruma entre planos
    for (let i = 0; i < 120; i++) {
      brush(ctx, rand, rand() * W, HORIZON - rand() * H * 0.12, 60 + rand() * 90, 6 + rand() * 8, (rand() - 0.5) * 0.05, jitter(rand, '#6b2a26', 14), 0.08)
    }
    await nextIdle()
    if (isCancelled()) return false
  }

  // 3. edificios cercanos a los lados, enmarcando la escena
  for (const side of [0, 1]) {
    let x = side ? W - 60 - rand() * 60 : -20
    const end = side ? W + 20 : 60 + rand() * 80
    while (x < end) {
      const bw = 60 + rand() * 60
      const top = H * (0.05 + rand() * 0.2)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#120a0b'
      ctx.fillRect(x, top, bw, HORIZON - top + 6)
      for (let sx = x + 4; sx < x + bw; sx += 6) {
        brush(ctx, rand, sx, (top + HORIZON) / 2, HORIZON - top, 5, Math.PI / 2, jitter(rand, '#160c0d', 6), 0.6)
      }
      for (let wy = top + 14; wy < HORIZON - 10; wy += 16) {
        for (let wx = x + 8; wx < x + bw - 8; wx += 14) {
          if (rand() > 0.22) continue
          brush(ctx, rand, wx + (rand() - 0.5) * 3, wy, 6 + rand() * 4, 5 + rand() * 2, (rand() - 0.5) * 0.15, jitter(rand, '#ffb347', 30), 0.55 + rand() * 0.35)
          lights.push({ x: wx, y: wy, w: 7, color: '#ffb347', strength: 0.6 })
        }
      }
      x += bw
    }
  }
  await nextIdle()
  if (isCancelled()) return false

  // 4. calle mojada
  for (let y = HORIZON; y < H + 10; y += 5) {
    const t = (y - HORIZON) / (H - HORIZON)
    const base = lerpColor('#2a1012', '#0b0808', t)
    for (let x = -20; x < W + 20; x += 20 + rand() * 20) {
      brush(ctx, rand, x, y, 50 + rand() * 60, 6 + rand() * 4, (rand() - 0.5) * 0.04, jitter(rand, base, 8), 0.9)
    }
  }
  // reflejos de las luces, cortados por la lluvia que cae en los charcos
  for (const l of lights) {
    const depth = HORIZON - l.y
    const len = Math.min(H - HORIZON, depth * 0.9 + 30)
    for (let d = 0; d < len; d += 4 + rand() * 5) {
      const fade = 1 - d / len
      const wobble = Math.sin(d * 0.35 + l.x) * 2.5
      brush(ctx, rand, l.x + wobble, HORIZON + 4 + d, l.w * (1.2 + rand()), 2 + rand() * 2, 0, jitter(rand, l.color, 25), l.strength * fade * 0.55)
    }
  }
  await nextIdle()
  if (isCancelled()) return false

  // 5. neblina sobre el horizonte y lluvia fija muy tenue
  for (let i = 0; i < 160; i++) {
    brush(ctx, rand, rand() * W, HORIZON + (rand() - 0.6) * 40, 80 + rand() * 120, 8 + rand() * 10, (rand() - 0.5) * 0.04, jitter(rand, '#8a3a2c', 20), 0.05)
  }
  ctx.globalAlpha = 0.12
  ctx.strokeStyle = '#ffd2a6'
  ctx.lineWidth = 0.7
  ctx.beginPath()
  for (let i = 0; i < 420; i++) {
    const x = rand() * (W + 100)
    const y = rand() * H
    const len = 8 + rand() * 18
    ctx.moveTo(x, y)
    ctx.lineTo(x - len * 0.25, y + len)
  }
  ctx.stroke()

  // 6. resplandor: la imagen borrosa encima, en modo pantalla, como luz difusa en la lluvia
  ctx.save()
  ctx.filter = 'blur(7px)'
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = 0.4
  ctx.drawImage(canvas, 0, 0)
  ctx.restore()

  // 7. grano de lienzo
  const grain = ctx.getImageData(0, 0, W, H)
  const px = grain.data
  for (let i = 0; i < px.length; i += 4) {
    const n = (rand() - 0.5) * 16
    px[i] += n
    px[i + 1] += n
    px[i + 2] += n
  }
  ctx.putImageData(grain, 0, 0)
  ctx.globalAlpha = 1
  return true
}

export function PaintedCity() {
  const ref = useRef<HTMLCanvasElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let cancelled = false
    paintCity(canvas, () => cancelled).then((ok) => {
      if (ok && !cancelled) setDone(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className={`painted-city ${done ? 'is-done' : ''}`}
      aria-hidden="true"
    />
  )
}
