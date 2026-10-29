export type ArtKind = 'crt' | 'lanterns' | 'kitsune' | 'onair' | 'lamp' | 'laptop' | 'gamepad' | 'usb' | 'scroll' | 'heart' | 'wrench' | 'moth' | 'window' | 'palette'

export const ART_SIZES: Record<ArtKind, [number, number]> = {
  crt: [600, 600],
  lanterns: [600, 520],
  kitsune: [600, 600],
  onair: [640, 420],
  lamp: [440, 760],
  laptop: [240, 240],
  gamepad: [240, 240],
  usb: [240, 240],
  scroll: [240, 240],
  heart: [240, 240],
  wrench: [240, 240],
  moth: [160, 160],
  window: [240, 240],
  palette: [240, 240],
}
