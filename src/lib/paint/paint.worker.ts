import spartanBlack from '@fontsource/league-spartan/files/league-spartan-latin-900-normal.woff2?url'
import spartanBold from '@fontsource/league-spartan/files/league-spartan-latin-800-normal.woff2?url'
import mono from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url'
import type { Category } from '../../data/projects'
import type { CoverInput } from './cover'
import type { ArtKind } from './sizes'
import { renderArt, renderCovers, renderScene } from './jobs'
import type { Scene } from './scenes'

export type CoverItem = { project: CoverInput; index: number }
export type PaintRequest =
  | { type: 'scene'; scene: Scene }
  | { type: 'art'; kind: ArtKind }
  | { type: 'covers'; items: CoverItem[]; labels: Record<Category, string> }
export type PaintJob = PaintRequest & { id: number }
export type PaintResult = { id: number; blobs?: Blob[] | null; bitmaps?: ImageBitmap[] | null }

const scope = self as unknown as {
  fonts?: FontFaceSet
  onmessage: ((event: MessageEvent<PaintJob>) => void) | null
  postMessage: (message: PaintResult, transfer?: Transferable[]) => void
}

const fonts = [
  new FontFace('League Spartan', `url(${spartanBlack})`, { weight: '900' }),
  new FontFace('League Spartan', `url(${spartanBold})`, { weight: '800' }),
  new FontFace('JetBrains Mono', `url(${mono})`, { weight: '400 500' }),
]
fonts.forEach((font) => scope.fonts?.add(font))

scope.onmessage = async ({ data: job }) => {
  try {
    if (job.type === 'covers') {
      // las portadas llevan texto: esperar las fuentes antes de dibujar
      await Promise.all(fonts.map((font) => font.load().catch(() => null)))
      const bitmaps = await renderCovers(job.items, job.labels)
      scope.postMessage({ id: job.id, bitmaps }, bitmaps ?? [])
      return
    }
    let blobs: Blob[] | null = null
    if (job.type === 'scene') blobs = await renderScene(job.scene)
    else {
      const blob = await renderArt(job.kind)
      blobs = blob ? [blob] : null
    }
    scope.postMessage({ id: job.id, blobs })
  } catch {
    scope.postMessage({ id: job.id, blobs: null, bitmaps: null })
  }
}
