import type { Category, Project } from '../data/projects'
import { ART_HEIGHT, ART_WIDTH, paintCover } from './paint/cover'
import { paintCoverBlobs } from './paint/paintClient'

export { ART_HEIGHT, ART_WIDTH }

function nextIdle() {
  return new Promise<void>((resolve) => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout: 500 })
    else setTimeout(resolve, 16)
  })
}

// Sin worker: dibuja la portada en el hilo principal, una por tarea.
async function drawCoverUrl(project: Project, index: number, labels: Record<Category, string>): Promise<string> {
  await nextIdle()
  const canvas = document.createElement('canvas')
  canvas.width = ART_WIDTH
  canvas.height = ART_HEIGHT
  const ctx = canvas.getContext('2d')
  if (ctx) paintCover(ctx, project, index, labels)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : ''), 'image/webp', 0.85))
}

// Una URL de portada por proyecto. covers: primera captura de cada repo (si hay), por nombre
// en minúsculas; esas se usan tal cual. Las demás se pintan y son URLs blob: (hay que revocarlas).
export async function buildProjectArtUrls(
  projects: Project[],
  labels: Record<Category, string>,
  covers: Record<string, string | undefined> = {},
): Promise<string[]> {
  const urls = projects.map((p) => covers[p.name.toLowerCase()] ?? '')
  const generated = projects.map((p, i) => ({ p, i })).filter(({ i }) => !urls[i])
  if (!generated.length) return urls

  const blobs = await paintCoverBlobs(
    generated.map(({ p, i }) => ({ project: { name: p.name, language: p.language, category: p.category }, index: i })),
    labels,
  )
  if (blobs) {
    generated.forEach(({ i }, n) => (urls[i] = URL.createObjectURL(blobs[n])))
    return urls
  }

  try {
    await Promise.all([
      document.fonts.load('900 100px "League Spartan"'),
      document.fonts.load('800 58px "League Spartan"'),
      document.fonts.load('500 24px "JetBrains Mono"'),
    ])
  } catch {
    // si las fuentes no cargan, se dibuja con las de respaldo
  }
  for (const { p, i } of generated) urls[i] = await drawCoverUrl(p, i, labels)
  return urls
}
