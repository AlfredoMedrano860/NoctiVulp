import type { Category, Project } from '../../data/projects'
import type { Ctx } from './core'

export type CoverInput = Pick<Project, 'name' | 'language' | 'category'>

export const ART_WIDTH = 1200
export const ART_HEIGHT = 900

// [tinta principal, tinta secundaria] por categoría, dentro de "Noche Fuego".
const INKS: Record<Category, [string, string]> = {
  linux: ['#ff6b00', '#ffb347'],
  gaming: ['#e63946', '#ff6b00'],
  apps: ['#ffb347', '#ff6b00'],
  design: ['#ff6b00', '#e63946'],
}

const PAPER = '#14100d'
const CREAM = '#f4ede6'

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

// Sello 5×5 simétrico a partir del nombre, como los avatares por defecto de GitHub.
function stamp(rand: () => number): boolean[][] {
  for (;;) {
    const half = Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => rand() < 0.52))
    const cells = half.map((row) => [row[0], row[1], row[2], row[1], row[0]])
    const filled = cells.flat().filter(Boolean).length
    if (filled >= 9 && filled <= 18) return cells
  }
}

function drawStamp(ctx: Ctx, cells: boolean[][], x: number, y: number, cell: number, color: string) {
  ctx.fillStyle = color
  const gap = cell * 0.12
  cells.forEach((row, r) =>
    row.forEach((on, c) => {
      if (!on) return
      ctx.beginPath()
      ctx.roundRect(x + c * cell + gap / 2, y + r * cell + gap / 2, cell - gap, cell - gap, cell * 0.16)
      ctx.fill()
    }),
  )
}

export function paintCover(ctx: Ctx, project: CoverInput, index: number, labels: Record<Category, string>) {
  const w = ART_WIDTH
  const h = ART_HEIGHT
  const [ink, ink2] = INKS[project.category]
  const rand = seeded(project.name.toLowerCase())

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 14000; i++) {
    ctx.fillStyle = rand() < 0.5 ? 'rgba(244, 237, 230, 0.035)' : 'rgba(0, 0, 0, 0.18)'
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 1.5, 1 + rand() * 1.5)
  }

  const margin = 56
  ctx.strokeStyle = 'rgba(244, 237, 230, 0.1)'
  ctx.lineWidth = 2
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2)

  const cells = stamp(rand)
  const cell = h * 0.096
  const size = cell * 5
  const sx = (w - size) / 2
  const sy = (h - size) / 2 - h * 0.02
  const shift = cell * 0.14
  drawStamp(ctx, cells, sx + shift, sy + shift, cell, rgba(ink2, 0.55))
  drawStamp(ctx, cells, sx, sy, cell, ink)

  ctx.textBaseline = 'alphabetic'
  ctx.font = '400 30px "JetBrains Mono", monospace'
  ctx.letterSpacing = '5px'
  ctx.fillStyle = rgba(ink2, 0.9)
  ctx.fillText(labels[project.category].toUpperCase(), margin + 32, margin + 60)
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(244, 237, 230, 0.45)'
  ctx.fillText(String(index + 1).padStart(2, '0'), w - margin - 32, margin + 60)

  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'
  const base = h - margin - 36
  ctx.font = '400 32px "JetBrains Mono", monospace'
  ctx.fillStyle = 'rgba(244, 237, 230, 0.45)'
  const owner = 'noctivulp-ch/'
  ctx.fillText(owner, margin + 32, base)
  const ownerWidth = ctx.measureText(owner).width
  ctx.font = '800 42px "League Spartan", sans-serif'
  ctx.fillStyle = CREAM
  ctx.fillText(project.name, margin + 32 + ownerWidth, base, w - margin * 2 - ownerWidth - 280)

  ctx.textAlign = 'right'
  ctx.font = '400 30px "JetBrains Mono", monospace'
  ctx.fillStyle = 'rgba(244, 237, 230, 0.6)'
  const language = project.language ?? 'multi'
  ctx.fillText(language, w - margin - 32, base)
  const langWidth = ctx.measureText(language).width
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(w - margin - 32 - langWidth - 22, base - 11, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.textAlign = 'left'
}
