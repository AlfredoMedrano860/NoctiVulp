import spartanBlack from '@fontsource/league-spartan/files/league-spartan-latin-900-normal.woff2?url'
import type { ArtKind } from './sizes'
import { renderArt, renderScene } from './jobs'
import type { Scene } from './scenes'

export type PaintRequest = { type: 'scene'; scene: Scene } | { type: 'art'; kind: ArtKind }
export type PaintJob = PaintRequest & { id: number }
export type PaintResult = { id: number; blobs: Blob[] | null }

const scope = self as unknown as {
  fonts?: FontFaceSet
  onmessage: ((event: MessageEvent<PaintJob>) => void) | null
  postMessage: (message: PaintResult) => void
}

scope.fonts?.add(new FontFace('League Spartan', `url(${spartanBlack})`, { weight: '900' }))

scope.onmessage = async ({ data: job }) => {
  let blobs: Blob[] | null = null
  try {
    if (job.type === 'scene') blobs = await renderScene(job.scene)
    else {
      const blob = await renderArt(job.kind)
      blobs = blob ? [blob] : null
    }
  } catch {
    blobs = null
  }
  scope.postMessage({ id: job.id, blobs })
}
