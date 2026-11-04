import type { Category } from '../../data/projects'
import type { CoverItem, PaintJob, PaintResult } from './paint.worker'

let workerUsable =
  typeof Worker !== 'undefined' &&
  typeof OffscreenCanvas !== 'undefined' &&
  typeof OffscreenCanvas.prototype.convertToBlob === 'function'
let worker: Worker | null = null
let nextId = 0
const pending = new Map<number, (blobs: Blob[] | null) => void>()

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./paint.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }: MessageEvent<PaintResult>) => {
    pending.get(data.id)?.(data.blobs)
    pending.delete(data.id)
  }
  worker.onerror = () => {
    workerUsable = false
    worker?.terminate()
    worker = null
    for (const resolve of pending.values()) resolve(null)
    pending.clear()
  }
  return worker
}

// Portadas generadas en el worker, ya en webp. null: sin worker (quien llama las dibuja en el hilo principal).
export function paintCoverBlobs(items: CoverItem[], labels: Record<Category, string>): Promise<Blob[] | null> {
  if (!workerUsable) return Promise.resolve(null)
  return new Promise((resolve) => {
    const id = ++nextId
    pending.set(id, resolve)
    getWorker().postMessage({ id, items, labels } satisfies PaintJob)
  })
}
