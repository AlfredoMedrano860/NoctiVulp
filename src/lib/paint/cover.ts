import type { Category, Project } from '../../data/projects'
import type { Ctx } from './core'

export type CoverInput = Pick<Project, 'name' | 'language' | 'category'>

export const ART_WIDTH = 1200
export const ART_HEIGHT = 900

// [principal, secundario, brillo profundo] por categoría, todo dentro de "Noche Fuego".
const PALETTES: Record<Category, [string, string, string]> = {
  linux: ['#ff6b00', '#ffb347', '#5a2104'],
  gaming: ['#e63946', '#ff6b00', '#4d0c12'],
  apps: ['#ffb347', '#ff6b00', '#4a2c06'],
  design: ['#ff6b00', '#e63946', '#3b1020'],
}

function seeded(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 10000) / 10000
  }
}

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function glow(ctx: Ctx, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, ART_WIDTH, ART_HEIGHT)
}

// Portada generada; se dibuja en el worker de pintura (o aquí, si no está disponible).
export function paintCover(ctx: Ctx, project: CoverInput, index: number, labels: Record<Category, string>) {
  const w = ART_WIDTH
  const h = ART_HEIGHT

  const [main, second, deep] = PALETTES[project.category]
  const rand = seeded(project.name)

  ctx.fillStyle = '#0b0a09'
  ctx.fillRect(0, 0, w, h)
  glow(ctx, w * (0.55 + rand() * 0.35), h * (0.2 + rand() * 0.4), w * 0.75, deep)
  glow(ctx, w * (0.6 + rand() * 0.3), h * (0.3 + rand() * 0.4), w * 0.45, rgba(main, 0.38))
  glow(ctx, w * rand() * 0.4, h * (0.7 + rand() * 0.3), w * 0.35, rgba(second, 0.16))

  ctx.strokeStyle = 'rgba(255, 179, 71, 0.05)'
  ctx.lineWidth = 1
  for (let x = 0; x < w; x += 60) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y < h; y += 60) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // lluvia
  ctx.lineCap = 'round'
  for (let i = 0; i < 140; i++) {
    const x = rand() * (w + 200)
    const y = rand() * h
    const len = 14 + rand() * 40
    ctx.strokeStyle = rgba(second, 0.04 + rand() * 0.14)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - len * 0.25, y + len)
    ctx.stroke()
  }

  // inicial gigante en contorno
  ctx.font = `900 ${h * 1.05}px "League Spartan", sans-serif`
  ctx.lineWidth = 3
  ctx.strokeStyle = rgba(main, 0.42)
  ctx.strokeText(project.name.charAt(0).toUpperCase(), w * 0.5, h * 1.0)

  // ventana de terminal
  const x = w * 0.07
  const y = h * 0.12
  const ww = w * 0.56
  const hh = h * 0.54
  ctx.fillStyle = 'rgba(13, 12, 11, 0.82)'
  ctx.strokeStyle = 'rgba(255, 179, 71, 0.2)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(x, y, ww, hh, 22)
  ctx.fill()
  ctx.stroke()
  ;['#e63946', '#ffb347', '#ff6b00'].forEach((c, i) => {
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.arc(x + 34 + i * 26, y + 32, 8, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.font = '500 24px "JetBrains Mono", monospace'
  ctx.fillStyle = second
  ctx.fillText(`$ git clone noctivulp-ch/${project.name}`, x + 30, y + 92, ww - 60)
  ctx.fillStyle = 'rgba(244, 237, 230, 0.55)'
  ctx.fillText(`→ ${project.language ?? 'multi'} · ${labels[project.category]}`, x + 30, y + 132, ww - 60)

  for (let i = 0; i < 7; i++) {
    const indent = Math.floor(rand() * 3) * 34
    const barW = 80 + rand() * (ww - 200 - indent)
    ctx.fillStyle = i % 3 === 0 ? rgba(main, 0.75) : i % 3 === 1 ? rgba(second, 0.45) : 'rgba(244,237,230,0.18)'
    ctx.beginPath()
    ctx.roundRect(x + 30 + indent, y + 168 + i * 36, barW, 14, 7)
    ctx.fill()
  }

  // rótulo
  ctx.font = '800 58px "League Spartan", sans-serif'
  ctx.fillStyle = '#f4ede6'
  ctx.fillText(project.name, x, h * 0.84, w * 0.86)
  ctx.font = '400 22px "JetBrains Mono", monospace'
  ctx.fillStyle = second
  ctx.fillText(`${String(index + 1).padStart(2, '0')} — ${labels[project.category]}`, x, h * 0.9)
}
