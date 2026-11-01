import type { Category } from '../../data/projects'
import { ART_HEIGHT, ART_WIDTH, paintCover, type CoverInput } from './cover'
import { canvasToImageBlob, createCanvas } from './core'
import { ART_SIZES, paintArt, type ArtKind } from './illustrations'
import { PAINTERS, paintSoft, SCENE_H, SCENE_W, type Scene } from './scenes'

export async function renderScene(scene: Scene): Promise<Blob[] | null> {
  const source = createCanvas(SCENE_W, SCENE_H)
  if (!(await PAINTERS[scene](source, () => false))) return null
  const soft = createCanvas(SCENE_W, SCENE_H)
  paintSoft(source, soft, scene === 'city' ? 8 : 6, scene === 'city' ? 0.5 : 0.42)
  const blobs = await Promise.all((scene === 'city' ? [soft, source] : [soft]).map((canvas) => canvasToImageBlob(canvas)))
  return blobs.every(Boolean) ? (blobs as Blob[]) : null
}

export async function renderArt(kind: ArtKind): Promise<Blob | null> {
  const [width, height] = ART_SIZES[kind]
  const canvas = createCanvas(width, height)
  if (!(await paintArt(kind, canvas))) return null
  return canvasToImageBlob(canvas)
}

export async function renderCovers(items: { project: CoverInput; index: number }[], labels: Record<Category, string>): Promise<ImageBitmap[] | null> {
  const bitmaps: ImageBitmap[] = []
  for (const { project, index } of items) {
    const canvas = new OffscreenCanvas(ART_WIDTH, ART_HEIGHT)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    paintCover(ctx, project, index, labels)
    bitmaps.push(canvas.transferToImageBitmap())
  }
  return bitmaps
}
