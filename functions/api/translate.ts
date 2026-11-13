interface Ai {
  run(model: string, input: { text: string; source_lang: string; target_lang: string }): Promise<{ translated_text?: string }>
}

interface Env {
  AI?: Ai
}

interface Context {
  request: Request
  env: Env
  waitUntil(promise: Promise<unknown>): void
}

const MODEL = '@cf/meta/m2m100-1.2b'
const LANGS = new Set(['es', 'en'])
const MAX_TEXTS = 600
const MAX_TEXT_LENGTH = 2000
const MAX_TOTAL = 60_000
const CHUNK_LENGTH = 1200
const CONCURRENCY = 4
const CACHE_SECONDS = 60 * 60 * 24 * 30

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  })

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function chunk(texts: string[]) {
  const groups: number[][] = []
  let current: number[] = []
  let length = 0
  texts.forEach((text, i) => {
    if (current.length && length + text.length > CHUNK_LENGTH) {
      groups.push(current)
      current = []
      length = 0
    }
    current.push(i)
    length += text.length + 1
  })
  if (current.length) groups.push(current)
  return groups
}

async function translateOne(ai: Ai, text: string, source: string, target: string) {
  const out = await ai.run(MODEL, { text, source_lang: source, target_lang: target })
  return typeof out.translated_text === 'string' && out.translated_text.trim() ? out.translated_text : text
}

async function translateGroup(ai: Ai, texts: string[], source: string, target: string) {
  if (texts.length > 1) {
    const joined = await translateOne(ai, texts.join('\n'), source, target)
    const lines = joined.split('\n')
    if (lines.length === texts.length) return lines
  }
  const result: string[] = []
  for (const text of texts) result.push(await translateOne(ai, text, source, target))
  return result
}

export async function onRequestPost({ request, env, waitUntil }: Context): Promise<Response> {
  if (!env.AI) return json({ error: 'Translation is not configured' }, 503)

  let body: { texts?: unknown; source?: unknown; target?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }
  const { texts, source, target } = body
  if (
    !Array.isArray(texts) ||
    texts.length === 0 ||
    texts.length > MAX_TEXTS ||
    !texts.every((t) => typeof t === 'string' && t.length <= MAX_TEXT_LENGTH && !t.includes('\n')) ||
    typeof source !== 'string' ||
    typeof target !== 'string' ||
    !LANGS.has(source) ||
    !LANGS.has(target) ||
    source === target
  ) {
    return json({ error: 'Invalid request' }, 400)
  }
  const list = texts as string[]
  if (list.reduce((sum, t) => sum + t.length, 0) > MAX_TOTAL) return json({ error: 'Too much text' }, 413)

  const cache = (caches as unknown as { default: Cache }).default
  const key = new Request(`https://translate.cache/${source}-${target}/${await sha256(list.join('\u0000'))}`)
  const hit = await cache.match(key)
  if (hit) return json(await hit.json(), 200, { 'X-Translation-Cache': 'hit' })

  try {
    const groups = chunk(list)
    const translated: string[] = new Array(list.length)
    let next = 0
    const worker = async () => {
      while (next < groups.length) {
        const group = groups[next++]
        const out = await translateGroup(env.AI as Ai, group.map((i) => list[i]), source, target)
        group.forEach((index, k) => (translated[index] = out[k]))
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, groups.length) }, worker))

    const payload = { texts: translated }
    waitUntil(
      cache.put(
        key,
        new Response(JSON.stringify(payload), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${CACHE_SECONDS}` },
        }),
      ),
    )
    return json(payload, 200, { 'X-Translation-Cache': 'miss' })
  } catch {
    return json({ error: 'Translation failed' }, 502)
  }
}
