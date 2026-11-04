// Utilidades de scroll sin bucles permanentes: reemplazan a ScrollTrigger, que deja un
// requestAnimationFrame corriendo siempre y obliga a redibujar cada frame aunque nada cambie.

type Unsubscribe = () => void

const subscribers = new Set<() => void>()
let queued = false

const run = () => {
  queued = false
  subscribers.forEach((fn) => fn())
}
const onEvent = () => {
  if (queued) return
  queued = true
  requestAnimationFrame(run)
}

// Llama a fn (como mucho una vez por frame) cuando hay scroll o cambia el tamaño de la
// ventana, y una vez al suscribirse.
export function onScrollFrame(fn: () => void): Unsubscribe {
  if (!subscribers.size) {
    window.addEventListener('scroll', onEvent, { passive: true })
    window.addEventListener('resize', onEvent)
  }
  subscribers.add(fn)
  fn()
  return () => {
    subscribers.delete(fn)
    if (subscribers.size) return
    window.removeEventListener('scroll', onEvent)
    window.removeEventListener('resize', onEvent)
  }
}

// Llama a fn una vez, cuando el borde superior de el llega a `line` (0 = arriba de la
// pantalla, 1 = abajo). Si ya quedó por encima (por ejemplo al saltar a una sección), también.
export function onReach(el: Element, fn: () => void, line = 0.88): Unsubscribe {
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting && entry.boundingClientRect.bottom >= 0) return
      io.disconnect()
      fn()
    },
    { rootMargin: `0px 0px -${Math.round((1 - line) * 100)}% 0px` },
  )
  io.observe(el)
  return () => io.disconnect()
}

// Mientras el está en pantalla, llama a fn con cada frame de scroll.
export function whileVisible(el: Element, fn: () => void): Unsubscribe {
  let stop: Unsubscribe | undefined
  const io = new IntersectionObserver(([entry]) => {
    stop?.()
    stop = entry.isIntersecting ? onScrollFrame(fn) : undefined
  })
  io.observe(el)
  return () => {
    io.disconnect()
    stop?.()
  }
}

// 0 → 1 según dónde está value entre start y end.
export const progressBetween = (value: number, start: number, end: number) =>
  Math.min(1, Math.max(0, (value - start) / (end - start || 1)))
