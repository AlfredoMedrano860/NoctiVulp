import type { Category, Project } from '../data/projects'
import { ART_HEIGHT, ART_WIDTH, paintCover } from './paint/cover'
import { paintCoverBitmaps } from './paint/paintClient'

export { ART_HEIGHT, ART_WIDTH }

function drawProjectArt(project: Project, index: number, labels: Record<Category, string>): HTMLCanvasElement {
  const canvas = blankCanvas()
  const ctx = canvas.getContext('2d')
  if (ctx) paintCover(ctx, project, index, labels)
  return canvas
}

function blankCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = ART_WIDTH
  canvas.height = ART_HEIGHT
  return canvas
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// Portada a partir de una captura real, recortada como object-fit: cover.
function drawScreenshotArt(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = ART_WIDTH
  canvas.height = ART_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const scale = Math.max(ART_WIDTH / img.naturalWidth, ART_HEIGHT / img.naturalHeight)
  const w = img.naturalWidth * scale
  const h = img.naturalHeight * scale
  ctx.fillStyle = '#0b0a09'
  ctx.fillRect(0, 0, ART_WIDTH, ART_HEIGHT)
  ctx.drawImage(img, (ART_WIDTH - w) / 2, (ART_HEIGHT - h) / 2, w, h)
  return canvas
}

// covers: primera captura de cada repo (si hay), por nombre en minúsculas.
export async function buildProjectArt(
  projects: Project[],
  labels: Record<Category, string>,
  covers: Record<string, string | undefined> = {},
): Promise<HTMLCanvasElement[]> {
  const canvases: (HTMLCanvasElement | undefined)[] = new Array(projects.length)
  const generated = projects.map((p, i) => ({ p, i })).filter(({ p }) => !covers[p.name.toLowerCase()])

  const bitmaps = generated.length
    ? await paintCoverBitmaps(
        generated.map(({ p, i }) => ({ project: { name: p.name, language: p.language, category: p.category }, index: i })),
        labels,
      )
    : []
  if (bitmaps) {
    generated.forEach(({ i }, n) => {
      const canvas = blankCanvas()
      canvas.getContext('2d')?.drawImage(bitmaps[n], 0, 0)
      bitmaps[n].close()
      canvases[i] = canvas
    })
  } else {
    try {
      await Promise.all([
        document.fonts.load('900 100px "League Spartan"'),
        document.fonts.load('800 58px "League Spartan"'),
        document.fonts.load('500 24px "JetBrains Mono"'),
      ])
    } catch {
      // si las fuentes no cargan, se dibuja con las de respaldo
    }
    // Sin worker: una portada por tarea, cediendo el hilo entre cada una.
    for (const { p, i } of generated) {
      await nextIdle()
      canvases[i] = drawProjectArt(p, i, labels)
    }
  }

  for (let i = 0; i < projects.length; i++) {
    if (canvases[i]) continue
    await nextIdle()
    const img = await loadImage(covers[projects[i].name.toLowerCase()] as string)
    canvases[i] = img ? drawScreenshotArt(img) : drawProjectArt(projects[i], i, labels)
  }
  return canvases as HTMLCanvasElement[]
}

function nextIdle() {
  return new Promise<void>((resolve) => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout: 500 })
    else setTimeout(resolve, 16)
  })
}

// Versión reducida para las previsualizaciones del índice, codificada fuera del hilo principal.
export function toPreviewUrl(source: HTMLCanvasElement, scale = 0.5): Promise<string> {
  const c = document.createElement('canvas')
  c.width = source.width * scale
  c.height = source.height * scale
  c.getContext('2d')?.drawImage(source, 0, 0, c.width, c.height)
  return new Promise((resolve) =>
    c.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : ''), 'image/webp', 0.82),
  )
}
