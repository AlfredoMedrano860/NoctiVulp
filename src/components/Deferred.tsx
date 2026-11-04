import { useEffect, useState, type ReactNode } from 'react'
import { enqueueMount, isProgressiveDone } from '../lib/progressive'

// Monta a sus hijos cuando les toca en la cola de montaje progresivo. Mientras tanto
// ocupa una pantalla, para que la página tenga alto y el pie no aparezca antes de tiempo.
export function Deferred({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(isProgressiveDone)

  useEffect(() => {
    if (show) return
    let alive = true
    enqueueMount(() => alive && setShow(true))
    return () => {
      alive = false
    }
  }, [show])

  return show ? <>{children}</> : <div className="deferred" aria-hidden="true" />
}

