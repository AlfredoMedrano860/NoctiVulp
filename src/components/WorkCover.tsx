import { useEffect, useRef, useState } from 'react'

// Portada del carrusel: la nueva entra con un fundido sobre la anterior (solo CSS).
export function WorkCover({ urls, index }: { urls: string[]; index: number }) {
  const keyRef = useRef(0)
  const [layers, setLayers] = useState([{ index, key: 0 }])

  useEffect(() => {
    setLayers((current) => {
      if (current[current.length - 1].index === index) return current
      keyRef.current += 1
      return [...current.slice(-1), { index, key: keyRef.current }]
    })
  }, [index])

  return (
    <div className="work-canvas work-cover">
      {layers.map(
        (layer, i) =>
          urls[layer.index] && (
            <img
              key={layer.key}
              src={urls[layer.index]}
              alt=""
              decoding="async"
              className={i === layers.length - 1 && layers.length > 1 ? 'is-entering' : ''}
            />
          ),
      )}
    </div>
  )
}
