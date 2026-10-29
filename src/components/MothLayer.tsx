import { PaintedArt } from './PaintedArt'

export function MothLayer({ positions }: { positions: { top: string; left: string }[] }) {
  return (
    <div className="moth-layer" aria-hidden="true">
      {positions.map((position) => (
        <PaintedArt key={`${position.top}-${position.left}`} kind="moth" className="drift-moth" style={position} />
      ))}
    </div>
  )
}
