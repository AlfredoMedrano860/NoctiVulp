import type { Category } from '../../data/projects'
import { ART_HEIGHT, ART_WIDTH, paintCover, type CoverInput } from './cover'

// Portadas generadas, ya codificadas en webp: el hilo principal solo crea las URLs.
export async function renderCovers(items: { project: CoverInput; index: number }[], labels: Record<Category, string>): Promise<Blob[] | null> {
  const blobs: Blob[] = []
  for (const { project, index } of items) {
    const canvas = new OffscreenCanvas(ART_WIDTH, ART_HEIGHT)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    paintCover(ctx, project, index, labels)
    blobs.push(await canvas.convertToBlob({ type: 'image/webp', quality: 0.85 }))
  }
  return blobs
}
