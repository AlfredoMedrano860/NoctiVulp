// Montaje progresivo: en la primera carga solo se arma la portada; las secciones de abajo
// entran de a una por tarea, en tiempo libre. Así ninguna tarea larga bloquea la página.
// Si la visita llega con #sección, o ya terminó la primera carga, todo se monta de una.

type Job = () => void

const queue: Job[] = []
let scheduled = false
let done = typeof location !== 'undefined' && location.hash.length > 1
const listeners = new Set<() => void>()

const idle = (cb: () => void) =>
  typeof requestIdleCallback === 'function' ? requestIdleCallback(cb, { timeout: 120 }) : setTimeout(cb, 16)

function finish() {
  if (done) return
  done = true
  listeners.forEach((listener) => listener())
}

function pump() {
  scheduled = false
  queue.shift()?.()
  if (queue.length) schedule()
  // la última sección se dibuja en esta tarea; avisar en la siguiente
  else idle(finish)
}

function schedule() {
  if (scheduled) return
  scheduled = true
  idle(pump)
}

export const isProgressiveDone = () => done

export function enqueueMount(job: Job) {
  queue.push(job)
  schedule()
}

export function onProgressiveDone(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
