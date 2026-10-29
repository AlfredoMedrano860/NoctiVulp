import { bloom, brush, featherEdges, getCtx, glowSpot, grain, jitter, paintRegion, seeded, type Ctx, type PaintCanvas, type Rand } from './core'
import { ART_SIZES, type ArtKind } from './sizes'

export { ART_SIZES, type ArtKind } from './sizes'

function moth(ctx: Ctx, rand: Rand, x: number, y: number, s: number, angle = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  for (const side of [-1, 1]) {
    paintRegion(
      ctx,
      rand,
      (c) => {
        c.moveTo(0, -2 * s)
        c.quadraticCurveTo(side * 9 * s, -12 * s, side * 15 * s, -9 * s)
        c.quadraticCurveTo(side * 12 * s, 0, 0, 1 * s)
        c.closePath()
      },
      { x: Math.min(0, side * 15 * s), y: -12 * s, w: 15 * s, h: 14 * s },
      '#ff6b00',
      { len: [3 * s, 6 * s], width: [1.5 * s, 2.5 * s], step: 1.5 * s },
    )
    paintRegion(
      ctx,
      rand,
      (c) => {
        c.moveTo(0, 0)
        c.quadraticCurveTo(side * 11 * s, 2 * s, side * 9 * s, 9 * s)
        c.quadraticCurveTo(side * 3 * s, 10 * s, 0, 4 * s)
        c.closePath()
      },
      { x: Math.min(0, side * 11 * s), y: 0, w: 11 * s, h: 10 * s },
      '#ffb347',
      { len: [3 * s, 5 * s], width: [1.5 * s, 2.5 * s], step: 1.5 * s },
    )
    ctx.fillStyle = '#140a0a'
    ctx.beginPath()
    ctx.arc(side * 6 * s, 5 * s, 1.6 * s, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#f4ede6'
  ctx.beginPath()
  ctx.ellipse(0, 2 * s, 1.4 * s, 6 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.roundRect(x, y, w, h, r)
}

function paintCrt(ctx: Ctx, rand: Rand) {
  glowSpot(ctx, 300, 270, 270, '#ff6b00', 0.3)

  paintRegion(ctx, rand, (c) => {
    c.moveTo(262, 430)
    c.lineTo(338, 430)
    c.lineTo(352, 478)
    c.lineTo(248, 478)
    c.closePath()
  }, { x: 248, y: 430, w: 104, h: 48 }, '#4a2c29', { angle: Math.PI / 2, len: [10, 20], width: [4, 6], step: 4 })
  paintRegion(ctx, rand, (c) => c.ellipse(300, 482, 120, 16, 0, 0, Math.PI * 2), { x: 180, y: 466, w: 240, h: 32 }, '#3e2522', { len: [20, 40], width: [4, 6], step: 4 })

  paintRegion(ctx, rand, (c) => roundRect(c, 108, 118, 384, 316, 34), { x: 108, y: 118, w: 384, h: 316 }, '#6e4339', {
    angle: Math.PI / 2,
    len: [20, 44],
    width: [6, 10],
    step: 6,
    alpha: 0.75,
  })
  for (let y = 140; y < 420; y += 6) brush(ctx, rand, 484, y, 14, 6, Math.PI / 2, jitter(rand, '#ffb347', 20), 0.6)
  for (let x = 140; x < 470; x += 8) brush(ctx, rand, x, 124, 16, 4, 0, jitter(rand, '#ffb347', 20), 0.35)
  for (let x = 130; x < 470; x += 10) brush(ctx, rand, x, 428, 22, 5, 0, '#160b0c', 0.6)

  paintRegion(ctx, rand, (c) => roundRect(c, 148, 154, 304, 222, 22), { x: 148, y: 154, w: 304, h: 222 }, '#0e0a0a', {
    len: [20, 40],
    width: [5, 8],
    step: 5,
    alpha: 0.6,
    amount: 6,
  })
  ctx.save()
  ctx.beginPath()
  roundRect(ctx, 148, 154, 304, 222, 22)
  ctx.clip()
  glowSpot(ctx, 300, 265, 210, '#ff6b00', 0.38)
  const rows = [0.55, 0.8, 0.4, 0.7, 0.3, 0.62]
  ctx.save()
  ctx.shadowColor = '#ffb347'
  ctx.shadowBlur = 10
  brush(ctx, rand, 186, 192, 18, 10, 0, '#ffb347', 0.95)
  rows.forEach((w, i) => {
    const len = 230 * w
    brush(ctx, rand, 206 + len / 2, 192 + i * 28, len, 7, 0, jitter(rand, i % 2 ? '#ff6b00' : '#ffb347', 20), 0.85)
  })
  ctx.fillStyle = '#ffb347'
  ctx.fillRect(186, 345, 14, 18)
  ctx.restore()
  ctx.globalAlpha = 0.25
  ctx.fillStyle = '#000'
  for (let y = 154; y < 376; y += 4) ctx.fillRect(148, y, 304, 1.4)
  ctx.globalAlpha = 1
  ctx.restore()

  paintRegion(ctx, rand, (c) => {
    c.moveTo(150, 512)
    c.lineTo(450, 512)
    c.lineTo(486, 566)
    c.lineTo(114, 566)
    c.closePath()
  }, { x: 114, y: 512, w: 372, h: 54 }, '#5a3631', { len: [16, 30], width: [4, 7], step: 4 })
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 13; k++) {
      const t = k / 12
      const y = 522 + r * 14
      const left = 150 - (y - 512) * 0.66
      const right = 450 + (y - 512) * 0.66
      brush(ctx, rand, left + 14 + (right - left - 28) * t, y, 14, 7, 0, jitter(rand, '#7a4a40', 14), 0.9)
    }
  }

  moth(ctx, rand, 446, 116, 2.4, -0.35)
}

function paintLanterns(ctx: Ctx, rand: Rand) {
  ctx.save()
  ctx.strokeStyle = 'rgba(30, 14, 14, 0.95)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, 60)
  ctx.quadraticCurveTo(300, 150, 600, 50)
  ctx.stroke()
  ctx.restore()

  const lanterns = [
    { x: 130, top: 96, w: 104, h: 150, color: '#e63946' },
    { x: 300, top: 118, w: 128, h: 182, color: '#ff6b00' },
    { x: 470, top: 92, w: 104, h: 150, color: '#e63946' },
  ]
  for (const l of lanterns) {
    const cy = l.top + 18 + l.h / 2
    glowSpot(ctx, l.x, cy, l.w * 1.4, l.color, 0.32)
    ctx.fillStyle = '#1e0e0e'
    ctx.fillRect(l.x - 1.5, l.top - 30, 3, 34)
    paintRegion(
      ctx,
      rand,
      (c) => c.ellipse(l.x, cy, l.w / 2, l.h / 2, 0, 0, Math.PI * 2),
      { x: l.x - l.w / 2, y: cy - l.h / 2, w: l.w, h: l.h },
      l.color,
      { angle: 0, len: [10, 22], width: [4, 7], step: 4, alpha: 0.75, amount: 22 },
    )
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(l.x, cy, l.w / 2, l.h / 2, 0, 0, Math.PI * 2)
    ctx.clip()
    glowSpot(ctx, l.x - l.w * 0.08, cy - l.h * 0.05, l.w * 0.6, '#ffd08a', 0.7)
    for (let k = 1; k < 9; k++) {
      const y = cy - l.h / 2 + (l.h * k) / 9
      const half = (l.w / 2) * Math.sqrt(1 - Math.pow((y - cy) / (l.h / 2), 2))
      ctx.strokeStyle = 'rgba(70, 12, 12, 0.55)'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(l.x - half, y)
      ctx.quadraticCurveTo(l.x, y + 5, l.x + half, y)
      ctx.stroke()
    }
    for (let y = cy - l.h / 2; y < cy + l.h / 2; y += 6) brush(ctx, rand, l.x - l.w * 0.42, y, 12, 6, Math.PI / 2, '#3a0a0c', 0.35)
    ctx.restore()
    paintRegion(ctx, rand, (c) => roundRect(c, l.x - l.w * 0.28, l.top, l.w * 0.56, 20, 4), { x: l.x - l.w * 0.28, y: l.top, w: l.w * 0.56, h: 20 }, '#1a0c0c', { len: [8, 14], width: [3, 5], step: 3 })
    paintRegion(ctx, rand, (c) => roundRect(c, l.x - l.w * 0.28, cy + l.h / 2 - 4, l.w * 0.56, 18, 4), { x: l.x - l.w * 0.28, y: cy + l.h / 2 - 4, w: l.w * 0.56, h: 18 }, '#1a0c0c', { len: [8, 14], width: [3, 5], step: 3 })
    for (let k = 0; k < 7; k++) brush(ctx, rand, l.x - 6 + k * 2, cy + l.h / 2 + 34, 34, 2, Math.PI / 2, jitter(rand, '#e63946', 20), 0.8)
  }
}

function paintKitsune(ctx: Ctx, rand: Rand) {
  glowSpot(ctx, 300, 300, 300, '#e63946', 0.2)
  const face = (c: Ctx) => {
    c.moveTo(300, 540)
    c.quadraticCurveTo(230, 470, 186, 392)
    c.quadraticCurveTo(140, 330, 146, 250)
    c.quadraticCurveTo(150, 190, 168, 160)
    c.lineTo(176, 54)
    c.quadraticCurveTo(220, 100, 252, 150)
    c.quadraticCurveTo(300, 138, 348, 150)
    c.quadraticCurveTo(380, 100, 424, 54)
    c.lineTo(432, 160)
    c.quadraticCurveTo(450, 190, 454, 250)
    c.quadraticCurveTo(460, 330, 414, 392)
    c.quadraticCurveTo(370, 470, 300, 540)
    c.closePath()
  }
  paintRegion(ctx, rand, face, { x: 140, y: 50, w: 320, h: 492 }, '#efe2d0', { len: [14, 30], width: [5, 9], step: 5, alpha: 0.7, amount: 12 })
  ctx.save()
  ctx.beginPath()
  face(ctx)
  ctx.clip()
  for (let i = 0; i < 160; i++) {
    const y = 60 + rand() * 480
    brush(ctx, rand, 150 + rand() * 70, y, 20 + rand() * 30, 6 + rand() * 6, Math.PI / 2 + (rand() - 0.5) * 0.4, jitter(rand, '#9c8576', 12), 0.35)
  }
  for (let i = 0; i < 90; i++) {
    brush(ctx, rand, 430 + rand() * 30, 120 + rand() * 300, 20 + rand() * 20, 4, Math.PI / 2, jitter(rand, '#ffb347', 20), 0.3)
  }
  ctx.restore()

  for (const side of [-1, 1]) {
    paintRegion(
      ctx,
      rand,
      (c) => {
        c.moveTo(300 + side * 116, 80)
        c.lineTo(300 + side * 128, 168)
        c.lineTo(300 + side * 72, 156)
        c.closePath()
      },
      { x: 300 + Math.min(side * 128, side * 72), y: 80, w: 56, h: 90 },
      '#e63946',
      { len: [8, 16], width: [3, 5], step: 3, amount: 20 },
    )
  }

  for (const side of [-1, 1]) {
    const ex = 300 + side * 68
    const ey = 262
    paintRegion(
      ctx,
      rand,
      (c) => {
        c.moveTo(ex - side * 40, ey + 8)
        c.quadraticCurveTo(ex, ey - 22, ex + side * 42, ey - 18)
        c.quadraticCurveTo(ex + side * 4, ey + 14, ex - side * 40, ey + 8)
        c.closePath()
      },
      { x: ex - 44, y: ey - 24, w: 88, h: 40 },
      '#140a0a',
      { len: [6, 12], width: [2, 4], step: 3, amount: 6 },
    )
    for (let k = 0; k < 3; k++) {
      brush(ctx, rand, ex + side * (30 + k * 10), ey - 34 - k * 14, 50 - k * 8, 6 - k, side * -0.7, jitter(rand, '#e63946', 18), 0.9)
    }
    for (let k = 0; k < 3; k++) {
      brush(ctx, rand, 300 + side * (92 + k * 6), 350 + k * 18, 48, 5, side * 0.15, jitter(rand, '#e63946', 18), 0.85)
    }
  }
  paintRegion(
    ctx,
    rand,
    (c) => {
      c.moveTo(300, 150)
      c.quadraticCurveTo(326, 188, 300, 222)
      c.quadraticCurveTo(274, 188, 300, 150)
      c.closePath()
    },
    { x: 274, y: 150, w: 52, h: 72 },
    '#ff6b00',
    { len: [6, 12], width: [3, 5], step: 3, amount: 20 },
  )
  paintRegion(ctx, rand, (c) => c.ellipse(300, 492, 18, 12, 0, 0, Math.PI * 2), { x: 282, y: 480, w: 36, h: 24 }, '#140a0a', {
    len: [6, 10],
    width: [3, 4],
    step: 3,
  })
  ctx.save()
  ctx.strokeStyle = 'rgba(230, 57, 70, 0.9)'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(300 + side * 150, 300)
    ctx.quadraticCurveTo(300 + side * 220, 340, 300 + side * 236, 430)
    ctx.stroke()
  }
  ctx.restore()
}

const fontSet = () => (typeof document === 'undefined' ? (self as unknown as { fonts?: FontFaceSet }).fonts : document.fonts)

async function paintOnAir(ctx: Ctx, rand: Rand) {
  await fontSet()?.load('900 120px "League Spartan"').catch(() => undefined)
  ctx.fillStyle = '#1a0c0d'
  ctx.fillRect(150, 40, 8, 80)
  ctx.fillRect(482, 40, 8, 80)
  ctx.save()
  ctx.strokeStyle = 'rgba(26, 12, 13, 0.95)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(470, 300)
  ctx.bezierCurveTo(500, 380, 600, 330, 640, 400)
  ctx.stroke()
  ctx.restore()

  glowSpot(ctx, 320, 210, 205, '#e63946', 0.35)
  paintRegion(ctx, rand, (c) => roundRect(c, 70, 112, 500, 196, 26), { x: 70, y: 112, w: 500, h: 196 }, '#1d0d10', {
    len: [24, 50],
    width: [6, 10],
    step: 6,
    alpha: 0.75,
  })
  for (const [bx, by] of [
    [94, 136],
    [546, 136],
    [94, 284],
    [546, 284],
  ]) {
    ctx.fillStyle = '#3a2224'
    ctx.beginPath()
    ctx.arc(bx, by, 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.save()
  ctx.shadowColor = '#e63946'
  ctx.shadowBlur = 26
  ctx.strokeStyle = '#ff4d5a'
  ctx.lineWidth = 6
  ctx.beginPath()
  roundRect(ctx, 96, 138, 448, 144, 18)
  ctx.stroke()
  ctx.font = '900 112px "League Spartan", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ff4d5a'
  ctx.fillText('ON AIR', 320, 218)
  ctx.shadowBlur = 50
  ctx.fillText('ON AIR', 320, 218)
  ctx.restore()
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 220, 210, 0.8)'
  ctx.lineWidth = 1.6
  ctx.font = '900 112px "League Spartan", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeText('ON AIR', 320, 218)
  ctx.beginPath()
  roundRect(ctx, 96, 138, 448, 144, 18)
  ctx.stroke()
  ctx.restore()
}

function paintLamp(ctx: Ctx, rand: Rand) {
  ctx.save()
  ctx.translate(0, 50)
  const BX = 300
  const BY = 150
  const cone = (c: Ctx) => {
    c.moveTo(BX - 26, BY + 20)
    c.lineTo(BX + 26, BY + 20)
    c.lineTo(BX + 128, 720)
    c.lineTo(BX - 230, 720)
    c.closePath()
  }
  ctx.save()
  ctx.beginPath()
  cone(ctx)
  ctx.clip()
  const g = ctx.createLinearGradient(0, BY, 0, 740)
  g.addColorStop(0, 'rgba(255, 179, 71, 0.4)')
  g.addColorStop(1, 'rgba(255, 107, 0, 0.04)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 440, 760)
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = '#ffe0b8'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i < 160; i++) {
    const x = rand() * 440
    const y = BY + rand() * 600
    const len = 10 + rand() * 22
    ctx.moveTo(x, y)
    ctx.lineTo(x - len * 0.25, y + len)
  }
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = '#160b0c'
  ctx.lineCap = 'round'
  ctx.lineWidth = 16
  ctx.beginPath()
  ctx.moveTo(110, 760)
  ctx.lineTo(110, 150)
  ctx.quadraticCurveTo(110, 96, 170, 100)
  ctx.lineTo(BX - 20, 112)
  ctx.stroke()
  ctx.restore()
  for (let y = 160; y < 750; y += 8) brush(ctx, rand, 116, y, 10, 3, Math.PI / 2, jitter(rand, '#ffb347', 20), 0.25)

  paintRegion(ctx, rand, (c) => {
    c.moveTo(BX - 46, 120)
    c.lineTo(BX + 46, 120)
    c.lineTo(BX + 30, 100)
    c.lineTo(BX - 30, 100)
    c.closePath()
  }, { x: BX - 46, y: 100, w: 92, h: 20 }, '#1a0d0e', { len: [10, 20], width: [3, 5], step: 3 })
  glowSpot(ctx, BX, BY - 10, 130, '#ff6b00', 0.45)
  glowSpot(ctx, BX, BY - 14, 60, '#ffd08a', 0.9)
  ctx.save()
  ctx.shadowColor = '#ffb347'
  ctx.shadowBlur = 30
  ctx.fillStyle = '#fff1d6'
  ctx.beginPath()
  ctx.ellipse(BX, 132, 22, 14, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  moth(ctx, rand, BX - 70, BY - 40, 1.6, -0.4)
  moth(ctx, rand, BX + 64, BY + 10, 1.3, 0.5)
  moth(ctx, rand, BX - 30, BY + 70, 1.1, 0.2)
  moth(ctx, rand, BX + 30, BY - 70, 0.9, -0.8)

  for (let i = 0; i < 30; i++) {
    brush(ctx, rand, BX - 30 + (rand() - 0.5) * 220, 662 + i * 1.4, 30 + rand() * 60, 2, 0, jitter(rand, '#ffb347', 20), 0.35 * (1 - i / 30))
  }
  ctx.restore()
}

function stroke(ctx: Ctx, rand: Rand, x1: number, y1: number, x2: number, y2: number, width: number, color: string) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const angle = Math.atan2(y2 - y1, x2 - x1)
  for (let i = 0; i < 3; i++) {
    brush(ctx, rand, (x1 + x2) / 2 + (rand() - 0.5) * 1.5, (y1 + y2) / 2 + (rand() - 0.5) * 1.5, len + width, width, angle, jitter(rand, color, 10), 0.85)
  }
}

function dot(ctx: Ctx, rand: Rand, x: number, y: number, radius: number, color: string) {
  paintRegion(ctx, rand, (c) => c.arc(x, y, radius, 0, Math.PI * 2), { x: x - radius, y: y - radius, w: radius * 2, h: radius * 2 }, color, {
    len: [radius * 0.6, radius * 1.2],
    width: [2, 3],
    step: 2,
  })
}

function paintLaptop(ctx: Ctx, rand: Rand) {
  glowSpot(ctx, 120, 110, 110, '#ff6b00', 0.25)
  paintRegion(ctx, rand, (c) => {
    c.moveTo(40, 170)
    c.lineTo(200, 170)
    c.lineTo(222, 196)
    c.lineTo(18, 196)
    c.closePath()
  }, { x: 18, y: 170, w: 204, h: 26 }, '#4a2c29', { len: [10, 22], width: [3, 5], step: 3 })
  paintRegion(ctx, rand, (c) => roundRect(c, 50, 58, 140, 112, 12), { x: 50, y: 58, w: 140, h: 112 }, '#6e4339', {
    angle: Math.PI / 2,
    len: [12, 26],
    width: [3, 5],
    step: 3,
  })
  paintRegion(ctx, rand, (c) => roundRect(c, 62, 70, 116, 88, 6), { x: 62, y: 70, w: 116, h: 88 }, '#1c100e', { len: [10, 20], width: [3, 4], step: 3, amount: 6 })
  glowSpot(ctx, 120, 114, 70, '#ffb347', 0.18)
  const lines: [number, number, number, string][] = [
    [72, 86, 54, '#ffb347'],
    [80, 100, 70, '#ff6b00'],
    [80, 114, 44, '#ffd08a'],
    [72, 128, 64, '#ff6b00'],
    [80, 142, 36, '#ffb347'],
  ]
  for (const [x, y, len, color] of lines) stroke(ctx, rand, x, y, x + len, y, 3.4, color)
  for (let row = 0; row < 2; row++) {
    for (let key = 0; key < 8; key++) brush(ctx, rand, 52 + key * 19 + row * 6, 179 + row * 9, 11, 4, 0, '#2a1716', 0.75)
  }
  moth(ctx, rand, 190, 60, 0.9, 0.5)
}

function paintGamepad(ctx: Ctx, rand: Rand) {
  glowSpot(ctx, 120, 128, 110, '#e63946', 0.22)
  paintRegion(ctx, rand, (c) => {
    c.moveTo(62, 92)
    c.bezierCurveTo(92, 80, 148, 80, 178, 92)
    c.bezierCurveTo(214, 104, 226, 172, 206, 186)
    c.bezierCurveTo(190, 198, 172, 184, 160, 164)
    c.lineTo(80, 164)
    c.bezierCurveTo(68, 184, 50, 198, 34, 186)
    c.bezierCurveTo(14, 172, 26, 104, 62, 92)
    c.closePath()
  }, { x: 20, y: 80, w: 200, h: 118 }, '#5b3a33', { len: [12, 26], width: [3, 5], step: 3 })
  stroke(ctx, rand, 62, 126, 90, 126, 9, '#2a1716')
  stroke(ctx, rand, 76, 112, 76, 140, 9, '#2a1716')
  const buttons: [number, number, string][] = [
    [164, 112, '#ff6b00'],
    [180, 126, '#ffb347'],
    [164, 140, '#e63946'],
    [148, 126, '#ffd08a'],
  ]
  for (const [x, y, color] of buttons) {
    glowSpot(ctx, x, y, 14, color, 0.35)
    dot(ctx, rand, x, y, 6, color)
  }
  dot(ctx, rand, 102, 152, 9, '#3a2220')
  dot(ctx, rand, 138, 152, 9, '#3a2220')
}

function paintUsb(ctx: Ctx, rand: Rand) {
  glowSpot(ctx, 120, 124, 110, '#ff6b00', 0.24)
  ctx.save()
  ctx.translate(120, 120)
  ctx.rotate(-0.45)
  ctx.translate(-120, -120)
  paintRegion(ctx, rand, (c) => roundRect(c, 98, 40, 44, 48, 4), { x: 98, y: 40, w: 44, h: 48 }, '#a8968a', { angle: Math.PI / 2, len: [8, 16], width: [2, 4], step: 3 })
  brush(ctx, rand, 111, 54, 10, 9, 0, '#2a1716', 0.85)
  brush(ctx, rand, 129, 54, 10, 9, 0, '#2a1716', 0.85)
  paintRegion(ctx, rand, (c) => roundRect(c, 86, 84, 68, 118, 16), { x: 86, y: 84, w: 68, h: 118 }, '#6e4339', { angle: Math.PI / 2, len: [12, 26], width: [3, 5], step: 3 })
  stroke(ctx, rand, 100, 128, 140, 128, 6, '#ff6b00')
  stroke(ctx, rand, 100, 142, 128, 142, 4, '#ffb347')
  glowSpot(ctx, 120, 180, 26, '#ffb347', 0.8)
  dot(ctx, rand, 120, 180, 5, '#fff1d6')
  ctx.restore()
  for (let i = 0; i < 9; i++) {
    const angle = rand() * Math.PI * 2
    const dist = 70 + rand() * 30
    brush(ctx, rand, 120 + Math.cos(angle) * dist, 124 + Math.sin(angle) * dist, 6 + rand() * 6, 2.2, angle, jitter(rand, '#ffd08a', 20), 0.7)
  }
}

function paintScroll(ctx: Ctx, rand: Rand) {
  glowSpot(ctx, 120, 120, 110, '#ffb347', 0.18)
  paintRegion(ctx, rand, (c) => roundRect(c, 58, 62, 124, 120, 8), { x: 58, y: 62, w: 124, h: 120 }, '#d6bd9c', { len: [12, 24], width: [3, 5], step: 3 })
  paintRegion(ctx, rand, (c) => c.ellipse(120, 62, 70, 11, 0, 0, Math.PI * 2), { x: 50, y: 51, w: 140, h: 22 }, '#a8845f', { len: [14, 28], width: [3, 5], step: 3 })
  paintRegion(ctx, rand, (c) => c.ellipse(120, 182, 70, 11, 0, 0, Math.PI * 2), { x: 50, y: 171, w: 140, h: 22 }, '#a8845f', { len: [14, 28], width: [3, 5], step: 3 })
  stroke(ctx, rand, 96, 104, 78, 120, 6, '#e63946')
  stroke(ctx, rand, 78, 120, 96, 136, 6, '#e63946')
  stroke(ctx, rand, 128, 98, 112, 142, 6, '#ff6b00')
  stroke(ctx, rand, 144, 104, 162, 120, 6, '#e63946')
  stroke(ctx, rand, 162, 120, 144, 136, 6, '#e63946')
  stroke(ctx, rand, 76, 160, 150, 160, 3, '#8a6d55')
  stroke(ctx, rand, 76, 84, 136, 84, 3, '#8a6d55')
}

function paintHeart(ctx: Ctx, rand: Rand) {
  glowSpot(ctx, 120, 124, 115, '#e63946', 0.3)
  paintRegion(ctx, rand, (c) => {
    c.moveTo(120, 190)
    c.bezierCurveTo(38, 134, 50, 62, 98, 68)
    c.bezierCurveTo(112, 70, 120, 82, 120, 92)
    c.bezierCurveTo(120, 82, 128, 70, 142, 68)
    c.bezierCurveTo(190, 62, 202, 134, 120, 190)
    c.closePath()
  }, { x: 44, y: 62, w: 152, h: 128 }, '#e63946', { angle: -0.6, len: [12, 26], width: [3, 6], step: 3 })
  for (let i = 0; i < 6; i++) brush(ctx, rand, 88 + rand() * 14, 92 + rand() * 18, 14, 4, -0.9, jitter(rand, '#ff9a8a', 12), 0.6)
  moth(ctx, rand, 176, 62, 1, 0.4)
}

function paintWrench(ctx: Ctx, rand: Rand) {
  glowSpot(ctx, 120, 120, 110, '#ff6b00', 0.2)
  ctx.save()
  ctx.translate(120, 120)
  ctx.rotate(-Math.PI / 4)
  ctx.translate(-120, -120)
  paintRegion(ctx, rand, (c) => roundRect(c, 108, 92, 24, 112, 10), { x: 108, y: 92, w: 24, h: 112 }, '#a8968a', { angle: Math.PI / 2, len: [12, 26], width: [3, 5], step: 3 })
  paintRegion(ctx, rand, (c) => c.arc(120, 70, 34, 0, Math.PI * 2), { x: 86, y: 36, w: 68, h: 68 }, '#a8968a', { len: [10, 20], width: [3, 5], step: 3 })
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillRect(108, 30, 24, 34)
  ctx.globalCompositeOperation = 'source-over'
  stroke(ctx, rand, 120, 150, 120, 190, 5, '#ff6b00')
  ctx.restore()
  for (let i = 0; i < 7; i++) {
    const angle = -0.8 + rand() * 1.4
    brush(ctx, rand, 172 + Math.cos(angle) * 22, 168 + Math.sin(angle) * 22, 8, 2.4, angle, jitter(rand, '#ffd08a', 20), 0.8)
  }
}

function paintMoth(ctx: Ctx, rand: Rand) {
  glowSpot(ctx, 80, 80, 60, '#ff6b00', 0.2)
  moth(ctx, rand, 80, 80, 3.4, -0.2)
}

function paintWindow(ctx: Ctx, rand: Rand) {
  glowSpot(ctx, 120, 120, 110, '#ff6b00', 0.22)
  paintRegion(ctx, rand, (c) => roundRect(c, 40, 56, 160, 128, 14), { x: 40, y: 56, w: 160, h: 128 }, '#6e4339', { len: [14, 28], width: [3, 5], step: 3 })
  paintRegion(ctx, rand, (c) => roundRect(c, 50, 84, 140, 90, 8), { x: 50, y: 84, w: 140, h: 90 }, '#1c100e', { len: [10, 20], width: [3, 4], step: 3, amount: 6 })
  dot(ctx, rand, 60, 70, 4.5, '#e63946')
  dot(ctx, rand, 76, 70, 4.5, '#ffb347')
  dot(ctx, rand, 92, 70, 4.5, '#ff6b00')
  paintRegion(ctx, rand, (c) => roundRect(c, 60, 94, 40, 70, 6), { x: 60, y: 94, w: 40, h: 70 }, '#3a2220', { len: [8, 16], width: [2, 4], step: 3 })
  stroke(ctx, rand, 112, 102, 176, 102, 5, '#ff6b00')
  stroke(ctx, rand, 112, 118, 160, 118, 4, '#ffb347')
  stroke(ctx, rand, 112, 132, 170, 132, 4, '#ffd08a')
  paintRegion(ctx, rand, (c) => roundRect(c, 112, 144, 48, 18, 9), { x: 112, y: 144, w: 48, h: 18 }, '#ff6b00', { len: [8, 16], width: [2, 4], step: 3 })
  glowSpot(ctx, 136, 153, 30, '#ff6b00', 0.35)
}

function paintPalette(ctx: Ctx, rand: Rand) {
  glowSpot(ctx, 120, 124, 112, '#ffb347', 0.2)
  paintRegion(ctx, rand, (c) => {
    c.moveTo(118, 58)
    c.bezierCurveTo(176, 56, 210, 98, 202, 136)
    c.bezierCurveTo(196, 166, 166, 160, 156, 176)
    c.bezierCurveTo(146, 194, 124, 196, 104, 190)
    c.bezierCurveTo(52, 176, 30, 132, 46, 98)
    c.bezierCurveTo(58, 72, 86, 58, 118, 58)
    c.closePath()
  }, { x: 34, y: 54, w: 172, h: 140 }, '#c9a27c', { angle: 0.4, len: [12, 26], width: [3, 5], step: 3 })
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.ellipse(150, 150, 12, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  const paints: [number, number, string][] = [
    [80, 98, '#e63946'],
    [112, 82, '#ff6b00'],
    [146, 88, '#ffd08a'],
    [174, 116, '#8fbf6a'],
    [72, 136, '#6ea8d8'],
  ]
  for (const [x, y, color] of paints) dot(ctx, rand, x, y, 10, color)
  ctx.save()
  ctx.translate(132, 138)
  ctx.rotate(-0.8)
  paintRegion(ctx, rand, (c) => roundRect(c, -5, -6, 10, 80, 4), { x: -5, y: -6, w: 10, h: 80 }, '#4a2c29', { angle: Math.PI / 2, len: [10, 20], width: [2, 3], step: 2 })
  paintRegion(ctx, rand, (c) => roundRect(c, -6, -18, 12, 14, 3), { x: -6, y: -18, w: 12, h: 14 }, '#a8968a', { len: [6, 10], width: [2, 3], step: 2 })
  paintRegion(ctx, rand, (c) => {
    c.moveTo(-6, -18)
    c.quadraticCurveTo(0, -40, 6, -18)
    c.closePath()
  }, { x: -6, y: -40, w: 12, h: 22 }, '#e63946', { len: [6, 10], width: [2, 3], step: 2 })
  ctx.restore()
}

export async function paintArt(kind: ArtKind, canvas: PaintCanvas) {
  const ctx = getCtx(canvas)
  if (!ctx) return false
  const [w, h] = ART_SIZES[kind]
  const rand = seeded(kind.length * 977 + kind.charCodeAt(0))
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(0.86, 0.86)
  ctx.translate(-w / 2, -h / 2)
  if (kind === 'crt') paintCrt(ctx, rand)
  else if (kind === 'lanterns') paintLanterns(ctx, rand)
  else if (kind === 'kitsune') paintKitsune(ctx, rand)
  else if (kind === 'onair') await paintOnAir(ctx, rand)
  else if (kind === 'laptop') paintLaptop(ctx, rand)
  else if (kind === 'gamepad') paintGamepad(ctx, rand)
  else if (kind === 'usb') paintUsb(ctx, rand)
  else if (kind === 'scroll') paintScroll(ctx, rand)
  else if (kind === 'heart') paintHeart(ctx, rand)
  else if (kind === 'wrench') paintWrench(ctx, rand)
  else if (kind === 'moth') paintMoth(ctx, rand)
  else if (kind === 'window') paintWindow(ctx, rand)
  else if (kind === 'palette') paintPalette(ctx, rand)
  else paintLamp(ctx, rand)
  ctx.restore()
  bloom(ctx, canvas, 8, 0.35)
  grain(ctx, w, h, rand, 14)
  featherEdges(ctx, w, h)
  return true
}
