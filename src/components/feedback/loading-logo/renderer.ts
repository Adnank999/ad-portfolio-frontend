import {
  ACESFilmicToneMapping, DirectionalLight, Mesh, OrthographicCamera, PMREMGenerator, Scene,
  ShaderMaterial, SRGBColorSpace, TorusGeometry, WebGLRenderer, type Group, type WebGLRenderTarget,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { cloneLoadingModel, releaseLoadingModelInstance, loaderRingRadius, loaderViewExtent, prepareLoadingMaterials } from './model'
import { getLoadingModelTemplate } from './asset-cache'
import { cacheLoadingLogoPoster, getLoadingLogoPoster } from './poster'

export function createLoadingLogoRenderer(canvas: HTMLCanvasElement, modelUrl: string, warmup = false) {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power', stencil: false })
  } catch {
    return null
  }
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0, 0)
  const scene = new Scene()
  const camera = new OrthographicCamera(-loaderViewExtent, loaderViewExtent, loaderViewExtent, -loaderViewExtent, 0.1, 20)
  camera.position.z = 6
  const time = { value: 0 }
  const ringGeometry = new TorusGeometry(loaderRingRadius, 0.008, 6, 144)
  const ringMaterial = new ShaderMaterial({
    transparent: false,
    uniforms: { uTime: time },
    vertexShader: `
      varying vec2 vRingPosition;
      void main() {
        vRingPosition = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vRingPosition;
      void main() {
        float phase = fract(atan(vRingPosition.y, vRingPosition.x) / 3.141593 + uTime * 0.32);
        float distance = min(phase, 1.0 - phase);
        float light = exp(-distance * distance * 780.0) + exp(-phase * 13.0) * 0.55;
        vec3 color = vec3(0.35, 0.012, 0.075) + vec3(4.0, 0.95, 1.95) * light;
        color = color / (color + vec3(0.65));
        gl_FragColor = vec4(pow(color, vec3(0.78)), 1.0);
      }`,
  })
  const ring = new Mesh(ringGeometry, ringMaterial)
  ring.position.z = -0.35
  scene.add(ring)
  const key = new DirectionalLight(0xffc5da, 2)
  key.position.set(-2, 3, 4)
  const fill = new DirectionalLight(0xff286b, 1.4)
  fill.position.set(3, -1, 2)
  scene.add(key, fill)
  const request = new AbortController()
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let disposed = false
  let lost = false
  let visible = true
  let frame = 0
  let previousFrame = -Infinity
  let model: Group | null = null
  let modelReady = false
  let environment: WebGLRenderTarget | null = null
  canvas.dataset.modelState = 'loading'

  function draw() {
    if (disposed || lost) return
    renderer.render(scene, camera)
    canvas.dataset.renderState = 'ready'
    if (modelReady && !getLoadingLogoPoster()) {
      try { cacheLoadingLogoPoster(canvas.toDataURL('image/webp', 0.85)) } catch {}
    }
  }

  function tick(timestamp: number) {
    frame = 0
    if (disposed || lost || !visible || document.hidden || motion.matches) return
    if (timestamp - previousFrame >= 1000 / 30) {
      time.value += Math.min((timestamp - previousFrame) / 1000, 0.05)
      previousFrame = timestamp
      draw()
    }
    frame = requestAnimationFrame(tick)
  }

  function wake() {
    cancelAnimationFrame(frame)
    frame = 0
    previousFrame = -Infinity
    if (disposed || lost || !visible || document.hidden) return
    draw()
    if (!motion.matches) frame = requestAnimationFrame(tick)
  }

  function resize() {
    const size = Math.max(1, Math.min(512, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 1.5))))
    renderer.setPixelRatio(1)
    renderer.setSize(size, size, false)
    wake()
  }

  function contextLost(event: Event) {
    event.preventDefault()
    lost = true
    request.abort()
    cancelAnimationFrame(frame)
    canvas.dataset.renderState = 'fallback'
    canvas.dataset.modelState = 'error'
  }

  const resizeObserver = new ResizeObserver(resize)
  const intersectionObserver = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting)
    wake()
  })
  resizeObserver.observe(canvas)
  intersectionObserver.observe(canvas)
  document.addEventListener('visibilitychange', wake)
  motion.addEventListener('change', wake)
  canvas.addEventListener('webglcontextlost', contextLost)
  resize()

  async function loadModel() {
    const url = new URL(modelUrl, window.location.href)
    const template = await getLoadingModelTemplate(url.href)
    if (disposed || lost || request.signal.aborted) return
    model = cloneLoadingModel(template)
    prepareLoadingMaterials(model, time)
    const room = new RoomEnvironment()
    const pmrem = new PMREMGenerator(renderer)
    try {
      environment = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 128 })
      scene.environment = environment.texture
      scene.environmentIntensity = 0.6
    } finally {
      room.dispose()
      pmrem.dispose()
    }
    cancelAnimationFrame(frame)
    frame = 0
    scene.add(model)
    await renderer.compileAsync(scene, camera)
    if (disposed || lost) return
    modelReady = true
    canvas.dataset.modelState = 'ready'
    if (warmup) draw()
    else wake()
  }

  const ready = loadModel().then(() => modelReady).catch(() => {
    if (disposed || lost) return false
    if (model) {
      releaseLoadingModelInstance(model)
      model = null
    }
    canvas.dataset.modelState = 'error'
    wake()
    return false
  })

  return {
    ready,
    dispose() {
      disposed = true
      request.abort()
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', wake)
      motion.removeEventListener('change', wake)
      canvas.removeEventListener('webglcontextlost', contextLost)
      canvas.dataset.renderState = 'fallback'
      if (model) releaseLoadingModelInstance(model)
      scene.environment = null
      environment?.dispose()
      ringGeometry.dispose()
      ringMaterial.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}

let warmupRequest: Promise<void> | undefined

export function prewarmLoadingLogo(modelUrl: string) {
  if (getLoadingLogoPoster()) return Promise.resolve()
  if (warmupRequest) return warmupRequest
  warmupRequest = (async () => {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.cssText = 'position:fixed;left:0;top:0;width:320px;height:320px;visibility:hidden;pointer-events:none'
    document.body.appendChild(canvas)
    const instance = createLoadingLogoRenderer(canvas, modelUrl, true)
    try { await instance?.ready } finally {
      instance?.dispose()
      canvas.remove()
    }
  })().finally(() => { warmupRequest = undefined })
  return warmupRequest
}
