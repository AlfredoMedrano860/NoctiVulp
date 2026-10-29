import { useEffect, useRef } from 'react'

interface Drop {
  x: number
  y: number
  len: number
  speed: number
  // índice del grupo de opacidad: las gotas se dibujan por grupos en un solo trazo
  layer: number
}

interface Ember {
  x: number
  y: number
  r: number
  speed: number
  drift: number
  life: number
}

const RAIN_LAYERS = [0.1, 0.18, 0.28]

// Brasa con brillo pre-renderizada: dibujar una imagen es mucho más barato que shadowBlur.
function makeEmberSprite() {
  const size = 32
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255, 200, 140, 1)')
    g.addColorStop(0.2, 'rgba(255, 107, 0, 0.9)')
    g.addColorStop(1, 'rgba(255, 107, 0, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  return c
}

// Lluvia nocturna estilo Tokyo rain con brasas que suben: el fondo del hero.
export function RainCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sprite = makeEmberSprite()
    let width = 0
    let height = 0
    let drops: Drop[] = []
    let embers: Ember[] = []
    let frame = 0
    let last = 0

    const newDrop = (randomY: boolean): Drop => ({
      x: Math.random() * (width + 200) - 100,
      y: randomY ? Math.random() * height : -40,
      len: 12 + Math.random() * 28,
      speed: 6 + Math.random() * 10,
      layer: Math.floor(Math.random() * RAIN_LAYERS.length),
    })

    const newEmber = (randomY: boolean): Ember => ({
      x: Math.random() * width,
      y: randomY ? Math.random() * height : height + 10,
      r: 0.6 + Math.random() * 1.8,
      speed: 0.3 + Math.random() * 0.8,
      drift: (Math.random() - 0.5) * 0.4,
      life: Math.random(),
    })

    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      const small = width < 760
      const dpr = small ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const density = Math.min(160, Math.round((width * height) / (small ? 14000 : 10000)))
      drops = Array.from({ length: density }, () => newDrop(true))
      embers = Array.from({ length: Math.round(density / 5) }, () => newEmber(true))
      if (reduceMotion) draw()
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.lineCap = 'round'
      ctx.lineWidth = 1
      RAIN_LAYERS.forEach((alpha, layer) => {
        ctx.strokeStyle = `rgba(255, 179, 71, ${alpha})`
        ctx.beginPath()
        for (const d of drops) {
          if (d.layer !== layer) continue
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x - d.len * 0.25, d.y + d.len)
        }
        ctx.stroke()
      })
      for (const e of embers) {
        ctx.globalAlpha = 0.8 * Math.sin(e.life * Math.PI)
        const s = e.r * 8
        ctx.drawImage(sprite, e.x - s / 2, e.y - s / 2, s, s)
      }
      ctx.globalAlpha = 1
    }

    const step = (now: number) => {
      frame = requestAnimationFrame(step)
      const interval = window.scrollY < window.innerHeight && width >= 760 ? 0 : 1000 / 30
      if (last && now - last < interval - 4) return
      // normaliza a 60 fps para que la velocidad no dependa de la pantalla
      const k = last ? Math.min((now - last) / 16.7, 3) : 1
      last = now
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i]
        d.y += d.speed * k
        d.x -= d.speed * 0.25 * k
        if (d.y > height) drops[i] = newDrop(false)
      }
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i]
        e.y -= e.speed * k
        e.x += e.drift * k
        e.life += 0.003 * k
        if (e.life >= 1 || e.y < -10) embers[i] = { ...newEmber(false), life: 0 }
      }
      draw()
    }

    // Solo anima cuando el hero se ve y la pestaña está activa.
    let inView = true
    let started = false
    const sync = () => {
      const shouldRun = started && inView && !document.hidden && !reduceMotion
      cancelAnimationFrame(frame)
      if (shouldRun) {
        last = 0
        frame = requestAnimationFrame(step)
      }
    }
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      sync()
    })
    io.observe(canvas)
    document.addEventListener('visibilitychange', sync)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const begin = () => {
      started = true
      sync()
    }
    const hasIdle = typeof requestIdleCallback === 'function'
    const idle = hasIdle ? requestIdleCallback(begin, { timeout: 3000 }) : setTimeout(begin, 1500)

    return () => {
      if (hasIdle) cancelIdleCallback(idle as number)
      else clearTimeout(idle)
      cancelAnimationFrame(frame)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  return <canvas ref={ref} className="rain-canvas" aria-hidden="true" />
}
