import { useEffect, useState } from 'react'
import { isProgressiveDone, onProgressiveDone } from '../lib/progressive'

// true cuando terminó el montaje progresivo de la primera carga.
export function useProgressiveDone() {
  const [done, setDone] = useState(isProgressiveDone)
  useEffect(() => (done ? undefined : onProgressiveDone(() => setDone(true))), [done])
  return done
}
