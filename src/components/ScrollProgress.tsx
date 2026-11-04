import { useEffect, useRef } from 'react'
import { onScrollFrame, progressBetween } from '../lib/scroll'

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(
    () =>
      onScrollFrame(() => {
        const el = ref.current
        const max = document.documentElement.scrollHeight - window.innerHeight
        if (el) el.style.transform = `scaleX(${progressBetween(window.scrollY, 0, max)})`
      }),
    [],
  )

  return <div ref={ref} className="scroll-progress" aria-hidden="true" />
}
