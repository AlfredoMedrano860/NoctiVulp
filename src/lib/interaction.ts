const EVENTS = ['scroll', 'wheel', 'pointerdown', 'touchstart', 'keydown'] as const

// Se resuelve con la primera interacción de la visita (o a los 6 s): el trabajo que
// no hace falta para la primera pintura espera a esto.
export const firstInteraction = new Promise<void>((resolve) => {
  const done = () => {
    EVENTS.forEach((type) => window.removeEventListener(type, done))
    window.clearTimeout(timer)
    resolve()
  }
  const timer = window.setTimeout(done, 6000)
  EVENTS.forEach((type) => window.addEventListener(type, done, { passive: true, once: true }))
})
