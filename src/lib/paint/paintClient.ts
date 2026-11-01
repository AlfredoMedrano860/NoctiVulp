import type { Category } from '../../data/projects'
import type { ArtKind } from './sizes'
import type { CoverItem, PaintJob, PaintRequest, PaintResult } from './paint.worker'
import type { Scene } from './scenes'

let workerUsable = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
let worker: Worker | null = null
let nextId = 0
const pending = new Map<number, { resolve: (result: PaintResult | null) => void; fallback: () => Promise<PaintResult | null> }>()

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./paint.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }: MessageEvent<PaintResult>) => {
    pending.get(data.id)?.resolve(data)
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

function run(job: PaintRequest, fallback: () => Promise<PaintResult | null>) {
  if (!workerUsable) return fallback()
  return new Promise<PaintResult | null>((resolve) => {
    const id = ++nextId
    pending.set(id, { resolve, fallback })
    getWorker().postMessage({ ...job, id } as PaintJob)
  })
}

export const paintSceneBlobs = (scene: Scene) =>
  run({ type: 'scene', scene }, () => import('./jobs').then(async ({ renderScene }) => ({ id: 0, blobs: await renderScene(scene) }))).then(
    (result) => result?.blobs ?? null,
  )

export const paintArtBlob = (kind: ArtKind) =>
  run({ type: 'art', kind }, () =>
    import('./jobs').then(async ({ renderArt }) => {
      const blob = await renderArt(kind)
      return { id: 0, blobs: blob ? [blob] : null }
    }),
  ).then((result) => result?.blobs?.[0] ?? null)

// Portadas generadas en el worker. null: sin worker (quien llama las dibuja en el hilo principal).
export const paintCoverBitmaps = (items: CoverItem[], labels: Record<Category, string>) =>
  workerUsable
    ? run({ type: 'covers', items, labels }, async () => null).then((result) => result?.bitmaps ?? null)
    : Promise.resolve(null)
