// Pinta las escenas de fondo y las ilustraciones y las guarda en public/paint/*.webp.
// Correr de nuevo (npm run paint) solo si se cambia el código de src/lib/paint.
// Necesita Google Chrome instalado (o CHROME_PATH apuntando al ejecutable).
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'

const OUT = join(process.cwd(), 'public', 'paint')
const CHROME =
  process.env.CHROME_PATH ??
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ].find(existsSync)
if (!CHROME) throw new Error('No encontré Chrome: define CHROME_PATH')

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' })
await server.listen()
const profile = mkdtempSync(join(tmpdir(), 'nv-paint-'))
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9399', `--user-data-dir=${profile}`, 'about:blank'])

try {
  let tabs
  for (let i = 0; i < 40 && !tabs; i++) {
    await new Promise((r) => setTimeout(r, 250))
    tabs = await fetch('http://127.0.0.1:9399/json').then((r) => r.json()).catch(() => undefined)
  }
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const waiting = new Map()
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data)
    waiting.get(msg.id)?.(msg)
    waiting.delete(msg.id)
  }
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      waiting.set(++id, resolve)
      ws.send(JSON.stringify({ id, method, params }))
    })
  const evaluate = async (expression) => {
    const { result } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description)
    return result.result.value
  }

  await send('Page.navigate', { url: 'http://localhost:5199/' })
  await new Promise((r) => setTimeout(r, 2000))

  const files = await evaluate(`(async () => {
    const m = await import('/src/lib/paint/export.ts')
    const toB64 = async (blob) => {
      const bytes = new Uint8Array(await blob.arrayBuffer())
      let s = ''
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      return btoa(s)
    }
    const out = {}
    for (const scene of ['city', 'alley', 'roof']) {
      const blobs = await m.renderScene(scene)
      if (!blobs) throw new Error('falló la escena ' + scene)
      out['scene-' + scene + '-soft.webp'] = await toB64(blobs[0])
      if (blobs[1]) out['scene-' + scene + '.webp'] = await toB64(blobs[1])
    }
    for (const kind of Object.keys(m.ART_SIZES)) {
      const blob = await m.renderArt(kind)
      if (!blob) throw new Error('falló la ilustración ' + kind)
      out['art-' + kind + '.webp'] = await toB64(blob)
    }
    return out
  })()`)

  mkdirSync(OUT, { recursive: true })
  for (const [name, b64] of Object.entries(files)) {
    const buf = Buffer.from(b64, 'base64')
    writeFileSync(join(OUT, name), buf)
    console.log(`${name.padEnd(28)} ${(buf.length / 1024).toFixed(1)} kB`)
  }
  ws.close()
} finally {
  chrome.kill()
  await server.close()
  setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500)
}
