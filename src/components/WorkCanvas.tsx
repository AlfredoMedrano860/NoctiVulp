import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { ART_HEIGHT, ART_WIDTH } from '../lib/projectArt'
import { gsap } from '../lib/motion'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex1;
  uniform sampler2D uTex2;
  uniform float uProgress;
  uniform float uTime;
  uniform float uHover;
  uniform float uVel;
  uniform vec2 uMouse;
  uniform vec2 uRes;
  uniform vec2 uImg;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  // object-fit: cover
  vec2 cover(vec2 uv) {
    vec2 s = uRes / uImg;
    float sc = max(s.x, s.y);
    vec2 size = uImg * sc;
    vec2 off = (uRes - size) * 0.5;
    return (uv * uRes - off) / size;
  }

  vec3 sampleRgb(sampler2D tex, vec2 uv, float shift) {
    return vec3(
      texture2D(tex, cover(uv + vec2(shift, 0.0))).r,
      texture2D(tex, cover(uv)).g,
      texture2D(tex, cover(uv - vec2(shift, 0.0))).b
    );
  }

  void main() {
    vec2 uv = vUv;

    // ondas según la velocidad del scroll
    uv.x += sin(uv.y * 8.0 + uTime * 1.5) * uVel * 0.03;

    // lupa alrededor del cursor
    vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
    float d = distance(uv * aspect, uMouse * aspect);
    float lens = smoothstep(0.45, 0.0, d) * uHover;
    uv -= (uv - uMouse) * lens * 0.18;

    // transición con ruido entre portadas
    float n = noise(uv * 3.5 + uTime * 0.15);
    float v = uv.y * 0.6 + n * 0.4;
    float p = uProgress * 1.3 - 0.15;
    float m = 1.0 - smoothstep(p - 0.12, p + 0.12, v);
    float wave = sin(uProgress * 3.14159);

    vec2 uv1 = uv + vec2(0.0, (n - 0.5) * 0.25 * wave + m * 0.1);
    vec2 uv2 = uv - vec2(0.0, (n - 0.5) * 0.25 * wave + (1.0 - m) * 0.1);
    float shift = abs(uVel) * 0.012 + lens * 0.012 + wave * 0.012;

    vec3 col = mix(sampleRgb(uTex1, uv1, shift), sampleRgb(uTex2, uv2, shift), m);

    // borde de brasa en el frente de la transición
    float edge = (1.0 - abs(m * 2.0 - 1.0)) * wave;
    col += vec3(1.0, 0.42, 0.0) * edge * 0.7;

    col *= 1.0 - smoothstep(0.45, 1.0, length(vUv - 0.5)) * 0.45;
    gl_FragColor = vec4(col, 1.0);
  }
`

function supportsWebGL() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

interface Scene {
  uniforms: Record<string, THREE.IUniform>
  textures: THREE.Texture[]
  shown: number
  tween?: gsap.core.Tween
  invalidate: () => void
}

interface WorkCanvasProps {
  arts: HTMLCanvasElement[]
  fallbackUrls: string[]
  index: number
}

export function WorkCanvas({ arts, fallbackUrls, index }: WorkCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<Scene | null>(null)
  const indexRef = useRef(index)
  const [failed] = useState(() => !supportsWebGL())

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas || failed || !arts.length) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const textures = arts.map((c) => {
      const t = new THREE.CanvasTexture(c)
      t.minFilter = THREE.LinearFilter
      t.generateMipmaps = false
      return t
    })
    const start = Math.min(indexRef.current, textures.length - 1)
    const uniforms: Record<string, THREE.IUniform> = {
      uTex1: { value: textures[start] },
      uTex2: { value: textures[start] },
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uVel: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uImg: { value: new THREE.Vector2(ART_WIDTH, ART_HEIGHT) },
    }
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    scene.add(new THREE.Mesh(geometry, material))

    // Solo se dibuja un frame cuando algo cambió; en reposo la GPU no trabaja.
    let dirty = true
    const invalidate = () => (dirty = true)
    sceneRef.current = { uniforms, textures, shown: start, invalidate }

    // Sube las portadas a la GPU de a una en tiempo libre, para que el primer
    // cambio de proyecto no se trabe subiendo una textura.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200))
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout
    let pending = textures.filter((_, i) => i !== start)
    let idleId = 0
    const uploadNext = () => {
      const t = pending.shift()
      if (!t) return
      renderer.initTexture(t)
      idleId = idle(uploadNext)
    }
    idleId = idle(uploadNext)

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect()
      renderer.setSize(width, height, false)
      ;(uniforms.uRes.value as THREE.Vector2).set(width, height)
      invalidate()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    const mouse = uniforms.uMouse.value as THREE.Vector2
    const mouseTarget = new THREE.Vector2(0.5, 0.5)
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      mouseTarget.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height)
    }
    const onEnter = () => gsap.to(uniforms.uHover, { value: 1, duration: 0.6, ease: 'power2.out' })
    const onLeave = () => gsap.to(uniforms.uHover, { value: 0, duration: 0.8, ease: 'power2.out' })
    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerenter', onEnter)
    wrap.addEventListener('pointerleave', onLeave)

    let lastY = window.scrollY
    const tick = (time: number) => {
      const y = window.scrollY
      const vel = gsap.utils.clamp(-1, 1, (y - lastY) / 40)
      lastY = y
      uniforms.uVel.value += (vel - uniforms.uVel.value) * 0.1
      if (Math.abs(uniforms.uVel.value) < 0.001) uniforms.uVel.value = 0
      mouse.lerp(mouseTarget, 0.12)
      uniforms.uTime.value = time

      const animating =
        uniforms.uProgress.value > 0 ||
        uniforms.uHover.value > 0.001 ||
        uniforms.uVel.value !== 0
      if (!animating && !dirty) return
      dirty = false
      renderer.render(scene, camera)
    }

    // El ticker solo corre mientras el canvas está en pantalla.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        lastY = window.scrollY
        invalidate()
        gsap.ticker.add(tick)
      } else {
        gsap.ticker.remove(tick)
      }
    })
    io.observe(wrap)

    return () => {
      gsap.ticker.remove(tick)
      cancelIdle(idleId)
      pending = []
      ro.disconnect()
      io.disconnect()
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerenter', onEnter)
      wrap.removeEventListener('pointerleave', onLeave)
      sceneRef.current?.tween?.kill()
      sceneRef.current = null
      textures.forEach((t) => t.dispose())
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [arts, failed])

  // transición al cambiar de proyecto
  useEffect(() => {
    const s = sceneRef.current
    if (!s || index === s.shown || !s.textures[index]) return
    const u = s.uniforms
    s.tween?.kill()
    if (u.uProgress.value > 0.5) u.uTex1.value = u.uTex2.value
    u.uTex2.value = s.textures[index]
    u.uProgress.value = 0
    s.shown = index
    s.tween = gsap.to(u.uProgress, {
      value: 1,
      duration: 1.3,
      ease: 'power2.inOut',
      onComplete: () => {
        u.uTex1.value = u.uTex2.value
        u.uProgress.value = 0
        s.invalidate()
      },
    })
  }, [index])

  return (
    <div ref={wrapRef} className="work-canvas">
      {failed ? (
        fallbackUrls[index] && <img src={fallbackUrls[index]} alt="" />
      ) : (
        <canvas ref={canvasRef} aria-hidden="true" />
      )}
    </div>
  )
}
