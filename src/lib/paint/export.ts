// Solo lo usa scripts/export-paintings.mjs: pinta las escenas y las ilustraciones
// una vez para guardarlas como imágenes en public/paint. La app no pinta nada de esto.
import { canvasToImageBlob, createCanvas } from './core'
import { ART_SIZES, paintArt, type ArtKind } from './illustrations'
import { PAINTERS, paintSoft, SCENE_H, SCENE_W, type Scene } from './scenes'

export async function renderScene(scene: Scene): Promise<Blob[] | null> {
  const source = createCanvas(SCENE_W, SCENE_H)
  if (!(await PAINTERS[scene](source, () => false))) return null
  const soft = createCanvas(SCENE_W, SCENE_H)
  paintSoft(source, soft, scene === 'city' ? 8 : 6, scene === 'city' ? 0.5 : 0.42)
  const blobs = await Promise.all((scene === 'city' ? [soft, source] : [soft]).map((canvas) => canvasToImageBlob(canvas, 'image/webp', 0.86)))
  return blobs.every(Boolean) ? (blobs as Blob[]) : null
}

export async function renderArt(kind: ArtKind): Promise<Blob | null> {
  const [width, height] = ART_SIZES[kind]
  const canvas = createCanvas(width, height)
  if (!(await paintArt(kind, canvas))) return null
  return canvasToImageBlob(canvas, 'image/webp', 0.88)
}

export { ART_SIZES }
