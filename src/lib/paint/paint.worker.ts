import spartanBlack from '@fontsource/league-spartan/files/league-spartan-latin-900-normal.woff2?url'
import spartanBold from '@fontsource/league-spartan/files/league-spartan-latin-800-normal.woff2?url'
import mono from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url'
import type { Category } from '../../data/projects'
import type { CoverInput } from './cover'
import { renderCovers } from './jobs'

export type CoverItem = { project: CoverInput; index: number }
export type PaintJob = { id: number; items: CoverItem[]; labels: Record<Category, string> }
export type PaintResult = { id: number; blobs: Blob[] | null }

const scope = self as unknown as {
  fonts?: FontFaceSet
  onmessage: ((event: MessageEvent<PaintJob>) => void) | null
  postMessage: (message: PaintResult) => void
}

const fonts = [
  new FontFace('League Spartan', `url(${spartanBlack})`, { weight: '900' }),
  new FontFace('League Spartan', `url(${spartanBold})`, { weight: '800' }),
  new FontFace('JetBrains Mono', `url(${mono})`, { weight: '400 500' }),
]
fonts.forEach((font) => scope.fonts?.add(font))

scope.onmessage = async ({ data: job }) => {
  try {
    // las portadas llevan texto: esperar las fuentes antes de dibujar
    await Promise.all(fonts.map((font) => font.load().catch(() => null)))
    scope.postMessage({ id: job.id, blobs: await renderCovers(job.items, job.labels) })
  } catch {
    scope.postMessage({ id: job.id, blobs: null })
  }
}
