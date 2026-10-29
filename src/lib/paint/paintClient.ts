import type { ArtKind } from './sizes'
import type { PaintJob, PaintRequest, PaintResult } from './paint.worker'
import type { Scene } from './scenes'

let workerUsable = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
let worker: Worker | null = null
let nextId = 0
const pending = new Map<number, { resolve: (blobs: Blob[] | null) => void; fallback: () => Promise<Blob[] | null> }>()

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./paint.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }: MessageEvent<PaintResult>) => {
    pending.get(data.id)?.resolve(data.blobs)
    pending.delete(data.id)
  }
  worker.onerror = () => {
    workerUsable = false
    worker?.terminate()
    worker = null
    for (const [id, job] of pending) {
      void job.fallback().then(job.resolve)
      pending.delete(id)
    }
  }
  return worker
}

function run(job: PaintRequest, fallback: () => Promise<Blob[] | null>) {
  if (!workerUsable) return fallback()
  return new Promise<Blob[] | null>((resolve) => {
    const id = ++nextId
    pending.set(id, { resolve, fallback })
    getWorker().postMessage({ ...job, id } as PaintJob)
  })
}

export const paintSceneBlobs = (scene: Scene) =>
  run({ type: 'scene', scene }, () => import('./jobs').then(({ renderScene }) => renderScene(scene)))

export const paintArtBlob = (kind: ArtKind) =>
  run({ type: 'art', kind }, () => import('./jobs').then(async ({ renderArt }) => {
    const blob = await renderArt(kind)
    return blob ? [blob] : null
  })).then((blobs) => blobs?.[0] ?? null)
