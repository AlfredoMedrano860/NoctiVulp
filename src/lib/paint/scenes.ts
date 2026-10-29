import {
  bloom,
  brush,
  glowSpot,
  grain,
  jitter,
  lerpColor,
  nextIdle,
  paintRegion,
  rainStreaks,
  seeded,
  type Ctx,
  type PaintCanvas,
  createCanvas,
  getCtx,
  type Rand,
} from './core'

export const SCENE_W = 960
export const SCENE_H = 540
const W = SCENE_W
const H = SCENE_H

export type Scene = 'city' | 'alley' | 'roof'

interface Light {
  x: number
  y: number
  w: number
  color: string
  strength: number
}

type Cancelled = () => boolean

function sky(ctx: Ctx, rand: Rand, horizon: number, top: string, mid: string, low: string) {
  for (let y = 0; y < horizon + 20; y += 5) {
    const t = y / horizon
    const base = t < 0.6 ? lerpColor(top, mid, t / 0.6) : lerpColor(mid, low, (t - 0.6) / 0.4)
    for (let x = -20; x < W + 20; x += 18 + rand() * 20) {
      brush(ctx, rand, x, y + rand() * 4, 40 + rand() * 50, 9 + rand() * 6, (rand() - 0.5) * 0.12, jitter(rand, base, 6), 0.85)
    }
  }
}

function wetGround(ctx: Ctx, rand: Rand, from: number, near: string, far: string) {
  for (let y = from; y < H + 10; y += 5) {
    const t = (y - from) / (H - from)
    const base = lerpColor(near, far, t)
    for (let x = -20; x < W + 20; x += 20 + rand() * 20) {
      brush(ctx, rand, x, y, 50 + rand() * 60, 6 + rand() * 4, (rand() - 0.5) * 0.04, jitter(rand, base, 8), 0.9)
    }
  }
}

function reflections(ctx: Ctx, rand: Rand, lights: Light[], ground: number, scale = 0.9) {
  for (const l of lights) {
    const depth = Math.max(10, ground - l.y)
    const len = Math.min(H - ground, depth * scale + 30)
    for (let d = 0; d < len; d += 4 + rand() * 5) {
      const fade = 1 - d / len
      const wobble = Math.sin(d * 0.35 + l.x) * 2.5
      brush(ctx, rand, l.x + wobble, ground + 4 + d, l.w * (1.2 + rand()), 2 + rand() * 2, 0, jitter(rand, l.color, 25), l.strength * fade * 0.55)
    }
  }
}

function finish(ctx: Ctx, canvas: PaintCanvas, rand: Rand) {
  rainStreaks(ctx, rand, W, H, 420)
  bloom(ctx, canvas)
  grain(ctx, W, H, rand)
  ctx.globalAlpha = 1
}

export async function paintCity(canvas: PaintCanvas, cancelled: Cancelled) {
  const ctx = getCtx(canvas)
  if (!ctx) return false
  const rand = seeded(20261026)
  const HORIZON = H * 0.66
  const lights: Light[] = []

  sky(ctx, rand, HORIZON, '#0c090e', '#2a0f16', '#5e1c1a')
  for (let i = 0; i < 260; i++) {
    const x = W * (0.35 + rand() * 0.6)
    const y = HORIZON - rand() * rand() * H * 0.35
    brush(ctx, rand, x, y, 30 + rand() * 60, 8 + rand() * 10, (rand() - 0.5) * 0.2, jitter(rand, rand() > 0.5 ? '#ff6b00' : '#e63946', 20), 0.06 + rand() * 0.06)
  }
  await nextIdle()
  if (cancelled()) return false

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
      for (let sx = x + 3; sx < x + bw; sx += 5 + rand() * 3) {
        brush(ctx, rand, sx, top + bh / 2, bh, 4 + rand() * 3, Math.PI / 2 + (rand() - 0.5) * 0.03, jitter(rand, layer.color, 8), 0.5)
      }
      for (let wy = top + 8; wy < HORIZON - 6; wy += 8 + rand() * 5) {
        for (let wx = x + 5; wx < x + bw - 5; wx += 7 + rand() * 4) {
          if (rand() > layer.windows) continue
          const warm = rand() > 0.25 ? '#ffb347' : '#ff6b00'
          brush(ctx, rand, wx + (rand() - 0.5) * 2, wy, 3 + rand() * 3, 2.5 + rand() * 1.5, (rand() - 0.5) * 0.2, jitter(rand, warm, 30), layer.glow * (0.4 + rand() * 0.6))
          if (rand() > 0.85) lights.push({ x: wx, y: wy, w: 3, color: warm, strength: layer.glow * 0.5 })
        }
      }
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
    for (let i = 0; i < 120; i++) {
      brush(ctx, rand, rand() * W, HORIZON - rand() * H * 0.12, 60 + rand() * 90, 6 + rand() * 8, (rand() - 0.5) * 0.05, jitter(rand, '#6b2a26', 14), 0.08)
    }
    await nextIdle()
    if (cancelled()) return false
  }

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
  if (cancelled()) return false

  wetGround(ctx, rand, HORIZON, '#2a1012', '#0b0808')
  reflections(ctx, rand, lights, HORIZON)
  for (let i = 0; i < 160; i++) {
    brush(ctx, rand, rand() * W, HORIZON + (rand() - 0.6) * 40, 80 + rand() * 120, 8 + rand() * 10, (rand() - 0.5) * 0.04, jitter(rand, '#8a3a2c', 20), 0.05)
  }
  await nextIdle()
  if (cancelled()) return false
  finish(ctx, canvas, rand)
  return true
}

export async function paintAlley(canvas: PaintCanvas, cancelled: Cancelled) {
  const ctx = getCtx(canvas)
  if (!ctx) return false
  const rand = seeded(7171)
  const VX = W * 0.5
  const VY = H * 0.54
  const NEAR = 360 // mitad del ancho de la abertura del fondo
  const lights: Light[] = []

  sky(ctx, rand, VY, '#0b080d', '#24101a', '#4a1a1c')
  glowSpot(ctx, VX, VY - 10, 260, '#ff6b00', 0.45)
  glowSpot(ctx, VX, VY - 10, 90, '#ffb347', 0.5)
  await nextIdle()
  if (cancelled()) return false

  const wall = (side: -1 | 1, t: number, v: number) => {
    const x = VX + side * (W / 2 + 20) * (1 - t) + side * (NEAR / 6) * t
    const top = -20 + (VY - 110 + 20) * t
    const bottom = H + 20 - (H + 20 - (VY + 40)) * t
    return [x, top + (bottom - top) * v] as const
  }

  for (const side of [-1, 1] as const) {
    const [x0, y0] = wall(side, 0, 0)
    const [x1, y1] = wall(side, 1, 0)
    const [x2, y2] = wall(side, 1, 1)
    const [x3, y3] = wall(side, 0, 1)
    paintRegion(
      ctx,
      rand,
      (c) => {
        c.moveTo(x0, y0)
        c.lineTo(x1, y1)
        c.lineTo(x2, y2)
        c.lineTo(x3, y3)
        c.closePath()
      },
      { x: Math.min(x0, x1), y: -20, w: Math.abs(x1 - x0), h: H + 40 },
      side < 0 ? '#1c0d10' : '#170b0d',
      { angle: Math.PI / 2, len: [30, 70], width: [5, 9], step: 6, alpha: 0.6, amount: 8 },
    )

    for (let i = 0; i < 6; i++) {
      const t = 0.08 + i * 0.14 + rand() * 0.05
      const v = 0.18 + rand() * 0.25
      const [sx, sy] = wall(side, t, v)
      const [, ey] = wall(side, t, v + 0.28 + rand() * 0.12)
      const width = 22 * (1 - t) + 3
      const neon = ['#ff6b00', '#e63946', '#ffb347'][Math.floor(rand() * 3)]
      ctx.save()
      ctx.shadowColor = neon
      ctx.shadowBlur = 22 * (1 - t) + 6
      ctx.globalAlpha = 0.95
      ctx.fillStyle = jitter(rand, neon, 20)
      ctx.fillRect(sx - width / 2, sy, width, ey - sy)
      ctx.restore()
      for (let k = sy + width * 0.6; k < ey - width * 0.4; k += width * 0.9) {
        brush(ctx, rand, sx, k, width * 0.55, width * 0.18, 0, 'rgba(30, 8, 8, 1)', 0.5)
      }
      glowSpot(ctx, sx, (sy + ey) / 2, 60 * (1 - t) + 20, neon, 0.25)
      lights.push({ x: sx, y: (sy + ey) / 2, w: width * 0.6, color: neon, strength: 0.9 * (1 - t * 0.5) })
    }

    for (let i = 0; i < 9; i++) {
      const t = rand() * 0.85
      const v = 0.1 + rand() * 0.45
      const [wx, wy] = wall(side, t, v)
      const s = 18 * (1 - t) + 4
      if (rand() > 0.5) brush(ctx, rand, wx, wy, s, s * 0.7, 0, jitter(rand, '#ffb347', 30), 0.55)
      else {
        ctx.fillStyle = jitter(rand, '#2a1618', 8)
        ctx.globalAlpha = 0.9
        ctx.fillRect(wx - s / 2, wy, s, s * 0.6)
        ctx.globalAlpha = 1
      }
    }
  }
  await nextIdle()
  if (cancelled()) return false

  wetGround(ctx, rand, VY + 40, '#24100f', '#0c0808')
  for (const side of [-1, 1] as const) {
    const [x1, y1] = wall(side, 1, 1)
    const [x3, y3] = wall(side, 0, 1)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x3, y3)
    ctx.lineTo(side < 0 ? -20 : W + 20, H + 20)
    ctx.lineTo(side < 0 ? -20 : W + 20, y1)
    ctx.closePath()
    ctx.fillStyle = side < 0 ? '#1c0d10' : '#170b0d'
    ctx.fill()
    ctx.restore()
  }
  reflections(ctx, rand, lights.map((l) => ({ ...l, y: Math.min(l.y, VY + 30) })), VY + 40, 1.4)
  glowSpot(ctx, VX, VY + 70, 200, '#ff6b00', 0.18)
  await nextIdle()
  if (cancelled()) return false

  const [lx, ly] = wall(-1, 0.3, 0.2)
  const [rx, ry] = wall(1, 0.3, 0.2)
  ctx.save()
  ctx.strokeStyle = 'rgba(20, 10, 10, 0.9)'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(lx, ly)
  ctx.quadraticCurveTo(VX, ly + 60, rx, ry)
  ctx.stroke()
  ctx.restore()
  for (let i = 1; i < 7; i++) {
    const t = i / 7
    const px = (1 - t) * (1 - t) * lx + 2 * (1 - t) * t * VX + t * t * rx
    const py = (1 - t) * (1 - t) * ly + 2 * (1 - t) * t * (ly + 60) + t * t * ry
    const color = i % 2 ? '#e63946' : '#ff6b00'
    glowSpot(ctx, px, py + 14, 34, color, 0.45)
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = 14
    brush(ctx, rand, px, py + 14, 22, 15, Math.PI / 2, jitter(rand, color, 18), 0.95)
    ctx.restore()
    lights.push({ x: px, y: py + 14, w: 8, color, strength: 0.5 })
  }

  const figures = [
    { x: VX - 40, y: VY + 70, s: 0.9 },
    { x: VX + 70, y: VY + 105, s: 1.25 },
    { x: VX - 150, y: VY + 150, s: 1.7 },
  ]
  for (const f of figures) {
    const s = f.s
    ctx.save()
    ctx.fillStyle = '#0c0607'
    ctx.globalAlpha = 0.95
    ctx.fillRect(f.x - 7 * s, f.y - 34 * s, 14 * s, 34 * s)
    ctx.beginPath()
    ctx.ellipse(f.x, f.y - 36 * s, 26 * s, 13 * s, 0, Math.PI, 0)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 140, 50, 0.55)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.ellipse(f.x, f.y - 36 * s, 26 * s, 13 * s, 0, Math.PI * 1.05, Math.PI * 1.95)
    ctx.stroke()
    ctx.restore()
    brush(ctx, rand, f.x, f.y + 4, 40 * s, 4, 0, 'rgba(255, 120, 40, 1)', 0.12)
  }

  finish(ctx, canvas, rand)
  return true
}

export async function paintRooftop(canvas: PaintCanvas, cancelled: Cancelled) {
  const ctx = getCtx(canvas)
  if (!ctx) return false
  const rand = seeded(3301)
  const HORIZON = H * 0.68
  const PARAPET = H * 0.8

  sky(ctx, rand, HORIZON, '#0a0810', '#1d0e18', '#3d1519')
  const MX = W * 0.74
  const MY = H * 0.24
  glowSpot(ctx, MX, MY, 260, '#ffb347', 0.28)
  paintRegion(
    ctx,
    rand,
    (c) => c.arc(MX, MY, 46, 0, Math.PI * 2),
    { x: MX - 50, y: MY - 50, w: 100, h: 100 },
    '#f2c58a',
    { len: [10, 20], width: [4, 6], step: 4, alpha: 0.7, amount: 18 },
  )
  for (let i = 0; i < 40; i++) {
    brush(ctx, rand, MX + (rand() - 0.5) * 300, MY + (rand() - 0.5) * 90, 80 + rand() * 120, 6 + rand() * 8, (rand() - 0.5) * 0.08, jitter(rand, '#6b3a34', 14), 0.12)
  }
  await nextIdle()
  if (cancelled()) return false

  let x = -10
  while (x < W + 10) {
    const bw = 16 + rand() * 40
    const bh = 20 + rand() * 70
    ctx.fillStyle = jitter(rand, '#2c1418', 6)
    ctx.globalAlpha = 1
    ctx.fillRect(x, HORIZON - bh, bw, bh + 40)
    for (let wy = HORIZON - bh + 5; wy < HORIZON; wy += 6 + rand() * 4) {
      for (let wx = x + 3; wx < x + bw - 3; wx += 5 + rand() * 3) {
        if (rand() > 0.16) continue
        brush(ctx, rand, wx, wy, 2.5, 2, 0, jitter(rand, rand() > 0.3 ? '#ffb347' : '#ff6b00', 30), 0.5)
      }
    }
    x += bw + rand() * 4
  }
  for (let i = 0; i < 120; i++) {
    brush(ctx, rand, rand() * W, HORIZON - rand() * 40, 80 + rand() * 120, 8 + rand() * 10, 0, jitter(rand, '#6b2a26', 14), 0.08)
  }
  await nextIdle()
  if (cancelled()) return false

  const POLE = W * 0.14
  paintRegion(ctx, rand, (c) => c.rect(POLE - 6, H * 0.12, 12, H), { x: POLE - 6, y: H * 0.12, w: 12, h: H }, '#120a0b', {
    angle: Math.PI / 2,
    len: [30, 60],
    width: [3, 5],
    step: 4,
  })
  ctx.fillStyle = '#120a0b'
  ctx.fillRect(POLE - 40, H * 0.17, 80, 6)
  ctx.save()
  ctx.strokeStyle = 'rgba(16, 8, 9, 0.95)'
  ctx.lineWidth = 1.4
  for (let i = 0; i < 4; i++) {
    const y0 = H * 0.17 + 2
    const sx = POLE - 36 + i * 24
    ctx.beginPath()
    ctx.moveTo(sx, y0)
    ctx.quadraticCurveTo(W * 0.55, y0 + 70 + i * 14, W + 20, H * 0.1 + i * 18)
    ctx.stroke()
  }
  ctx.restore()

  const TX = W * 0.3
  const TW = 130
  const TT = H * 0.42
  ctx.save()
  ctx.strokeStyle = '#140a0b'
  ctx.lineWidth = 5
  for (const lx of [TX + 14, TX + 45, TX + TW - 45, TX + TW - 14]) {
    ctx.beginPath()
    ctx.moveTo(lx, TT + 110)
    ctx.lineTo(lx + (lx < TX + TW / 2 ? -8 : 8), PARAPET + 10)
    ctx.stroke()
  }
  ctx.restore()
  paintRegion(
    ctx,
    rand,
    (c) => {
      c.moveTo(TX, TT + 14)
      c.lineTo(TX, TT + 110)
      c.ellipse(TX + TW / 2, TT + 110, TW / 2, 12, 0, Math.PI, 0, true)
      c.lineTo(TX + TW, TT + 14)
      c.ellipse(TX + TW / 2, TT + 14, TW / 2, 12, 0, 0, Math.PI, true)
    },
    { x: TX, y: TT, w: TW, h: 125 },
    '#2a1316',
    { angle: Math.PI / 2, len: [20, 40], width: [5, 8], step: 5, alpha: 0.7 },
  )
  paintRegion(
    ctx,
    rand,
    (c) => {
      c.moveTo(TX - 4, TT + 14)
      c.lineTo(TX + TW / 2, TT - 22)
      c.lineTo(TX + TW + 4, TT + 14)
      c.closePath()
    },
    { x: TX - 4, y: TT - 22, w: TW + 8, h: 36 },
    '#331719',
    { len: [12, 22], width: [4, 6], step: 4 },
  )
  for (let y = TT + 18; y < TT + 108; y += 6) brush(ctx, rand, TX + TW - 6, y, 8, 3, Math.PI / 2, '#ffb347', 0.25)
  for (let y = TT + 30; y < TT + 108; y += 22) brush(ctx, rand, TX + TW / 2, y, TW - 10, 2, 0, '#140a0b', 0.5)

  for (const [ax, ah] of [
    [W * 0.82, 150],
    [W * 0.88, 110],
    [W * 0.62, 80],
  ] as const) {
    ctx.save()
    ctx.strokeStyle = '#140a0b'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(ax, PARAPET)
    ctx.lineTo(ax, PARAPET - ah)
    for (let k = 0; k < 3; k++) {
      const y = PARAPET - ah + 12 + k * 16
      const w = 26 - k * 6
      ctx.moveTo(ax - w, y)
      ctx.lineTo(ax + w, y)
    }
    ctx.stroke()
    ctx.restore()
    glowSpot(ctx, ax, PARAPET - ah, 16, '#e63946', 0.8)
  }
  await nextIdle()
  if (cancelled()) return false

  paintRegion(ctx, rand, (c) => c.rect(-10, PARAPET, W + 20, H - PARAPET + 10), { x: -10, y: PARAPET, w: W + 20, h: H - PARAPET + 10 }, '#1b0f11', {
    len: [40, 90],
    width: [6, 10],
    step: 6,
    alpha: 0.75,
  })
  for (let x2 = -10; x2 < W + 10; x2 += 14 + rand() * 10) {
    brush(ctx, rand, x2, PARAPET + 2, 30 + rand() * 30, 3, 0, jitter(rand, '#ff8a3c', 30), 0.35)
  }
  for (let i = 0; i < 26; i++) {
    brush(ctx, rand, MX + (rand() - 0.5) * 60, PARAPET + 18 + i * 3, 20 + rand() * 40, 2, 0, jitter(rand, '#f2c58a', 20), 0.3 * (1 - i / 26))
  }

  finish(ctx, canvas, rand)
  return true
}

export const PAINTERS: Record<Scene, (c: PaintCanvas, cancelled: Cancelled) => Promise<boolean>> = {
  city: paintCity,
  alley: paintAlley,
  roof: paintRooftop,
}

export function paintSoft(src: PaintCanvas, dst: PaintCanvas, scale = 8, darken = 0.5) {
  const ctx = getCtx(dst)
  if (!ctx) return
  const tiny = createCanvas(W / scale, H / scale)
  const mid = createCanvas(W / 2, H / 2)
  getCtx(tiny)?.drawImage(src, 0, 0, tiny.width, tiny.height)
  const m = getCtx(mid)
  if (m) {
    m.imageSmoothingQuality = 'high'
    m.drawImage(tiny, 0, 0, mid.width, mid.height)
  }
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(mid, 0, 0, W, H)
  ctx.fillStyle = `rgba(12, 9, 10, ${darken})`
  ctx.fillRect(0, 0, W, H)
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.7)
  v.addColorStop(0, 'rgba(0, 0, 0, 0)')
  v.addColorStop(1, 'rgba(0, 0, 0, 0.55)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, W, H)
}
