const CACHE_NAME = 'nv-scenes'
const VERSION = encodeURIComponent(new URL(import.meta.url).pathname)
const enabled = !import.meta.env.DEV && typeof caches !== 'undefined'

const keyUrl = (key: string) => `/__nv-scenes/${VERSION}/${key}`

let pruned = false

async function openCache() {
  const cache = await caches.open(CACHE_NAME)
  if (!pruned) {
    pruned = true
    const stale = (await cache.keys()).filter((req) => !req.url.includes(`/${VERSION}/`))
    await Promise.all(stale.map((req) => cache.delete(req)))
  }
  return cache
}

export async function readScenes(keys: string[]): Promise<Blob[] | null> {
  if (!enabled) return null
  try {
    const cache = await openCache()
    const hits = await Promise.all(keys.map((key) => cache.match(keyUrl(key))))
    if (hits.some((hit) => !hit)) return null
    return await Promise.all(hits.map((hit) => (hit as Response).blob()))
  } catch {
    return null
  }
}

export async function storeScenes(keys: string[], blobs: Blob[]) {
  if (!enabled) return
  await openCache()
    .then((cache) => Promise.all(keys.map((key, i) => cache.put(keyUrl(key), new Response(blobs[i], { headers: { 'Content-Type': blobs[i].type } })))))
    .catch(() => undefined)
}

