export type Rand = () => number
export type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
export type PaintCanvas = HTMLCanvasElement | OffscreenCanvas

export function createCanvas(width: number, height: number): PaintCanvas {
  if (typeof document === 'undefined') return new OffscreenCanvas(width, height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export const getCtx = (canvas: PaintCanvas) => canvas.getContext('2d') as Ctx | null

export function canvasToImageBlob(canvas: PaintCanvas, type = 'image/webp', quality = 0.92): Promise<Blob | null> {
  if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality }).catch(() => null)
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export function seeded(seed: number): Rand {
  let s = seed >>> 0 || 1
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

export function jitter(rand: Rand, hex: string, amount = 14) {
  const [r, g, b] = hexToRgb(hex)
  const j = () => (rand() - 0.5) * 2 * amount
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + j())))
  return `rgb(${c(r)}, ${c(g)}, ${c(b)})`
}

export function lerpColor(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const m = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `#${[m(r1, r2), m(g1, g2), m(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function rgba(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function brush(
  ctx: Ctx,
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

interface RegionOptions {
  angle?: number
  len?: [number, number]
  width?: [number, number]
  alpha?: number
  amount?: number
  step?: number
  base?: boolean
}

export function paintRegion(
  ctx: Ctx,
  rand: Rand,
  path: (ctx: Ctx) => void,
  box: { x: number; y: number; w: number; h: number },
  color: string,
  { angle = 0, len = [14, 30], width = [4, 7], alpha = 0.8, amount = 14, step = 5, base = true }: RegionOptions = {},
) {
  ctx.save()
  ctx.beginPath()
  path(ctx)
  if (base) {
    ctx.globalAlpha = 1
    ctx.fillStyle = color
    ctx.fill()
  }
  ctx.clip()
  for (let y = box.y - 4; y < box.y + box.h + 4; y += step) {
    for (let x = box.x - 4; x < box.x + box.w + 4; x += step * (1.6 + rand())) {
      const l = len[0] + rand() * (len[1] - len[0])
      const w = width[0] + rand() * (width[1] - width[0])
      brush(ctx, rand, x + rand() * step, y + rand() * step, l, w, angle + (rand() - 0.5) * 0.25, jitter(rand, color, amount), alpha)
    }
  }
  ctx.restore()
}

export function glowSpot(ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, rgba(color, alpha))
  g.addColorStop(1, rgba(color, 0))
  ctx.save()
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
  ctx.restore()
}

export function rainStreaks(ctx: Ctx, rand: Rand, w: number, h: number, count: number, alpha = 0.12) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = '#ffd2a6'
  ctx.lineWidth = 0.7
  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    const x = rand() * (w + 100)
    const y = rand() * h
    const len = 8 + rand() * 18
    ctx.moveTo(x, y)
    ctx.lineTo(x - len * 0.25, y + len)
  }
  ctx.stroke()
  ctx.restore()
}

export function bloom(ctx: Ctx, canvas: PaintCanvas, blur = 7, alpha = 0.4) {
  ctx.save()
  ctx.filter = `blur(${blur}px)`
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = alpha
  ctx.drawImage(canvas, 0, 0)
  ctx.restore()
}

export function grain(ctx: Ctx, w: number, h: number, rand: Rand, amount = 16) {
  const img = ctx.getImageData(0, 0, w, h)
  const px = img.data
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue
    const n = (rand() - 0.5) * amount
    px[i] += n
    px[i + 1] += n
    px[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

export function featherEdges(ctx: Ctx, w: number, h: number, margin = 0.14) {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-in'
  const fade = (g: CanvasGradient) => {
    g.addColorStop(0, 'rgba(0, 0, 0, 0)')
    g.addColorStop(margin, 'rgba(0, 0, 0, 1)')
    g.addColorStop(1 - margin, 'rgba(0, 0, 0, 1)')
    g.addColorStop(1, 'rgba(0, 0, 0, 0)')
    return g
  }
  ctx.fillStyle = fade(ctx.createLinearGradient(0, 0, w, 0))
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = fade(ctx.createLinearGradient(0, 0, 0, h))
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

export const nextIdle = () =>
  new Promise<void>((resolve) => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => resolve(), { timeout: 300 })
    else setTimeout(resolve, 0)
  })
