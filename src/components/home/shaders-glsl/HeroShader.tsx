import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { addAfterEffect, useFrame, useThree } from '@react-three/fiber'
import { useMotionValue, useMotionValueEvent, type MotionValue } from 'framer-motion'
import { ClampToEdgeWrapping, Color, GLSL3, LinearFilter, LinearMipmapLinearFilter, LoadingManager, Mesh, MirroredRepeatWrapping, NoColorSpace, OrthographicCamera, PlaneGeometry, RawShaderMaterial, Scene, SRGBColorSpace, Texture, TextureLoader, Vector2, Vector3, WebGLRenderTarget } from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import vertexShader from './fullscreen.vert.glsl?raw'
import fragmentShader from './marble.frag.glsl?raw'
import feedbackShader from './feedback.frag.glsl?raw'
import blurShader from './blur.frag.glsl?raw'
import inspectShader from './inspect.frag.glsl?raw'
import type { HeroShaderControls } from './ShaderControls'
import marbleUrl from './assets/marble-desktop.ktx2?url'
import revealUrl from './assets/marble-01-desktop.ktx2?url'
import selectionUrl from './assets/marble-02-desktop.ktx2?url'
import timingUrl from './assets/marble-03-desktop.ktx2?url'
import gradientUrl from './assets/colorA.jpg'
import noiseUrl from './assets/noise.jpg'
import perlinUrl from './assets/noise2.png'
import decoderJsUrl from './basis/basis_transcoder.js?url'
import decoderWasmUrl from './basis/basis_transcoder.wasm?url'

type HeroShaderProps = {
  time: MotionValue<number>
  progress: MotionValue<number>
  heroRef: RefObject<HTMLElement | null>
  visible: boolean
  still: boolean
  compact: boolean
  onReady: (ready: boolean) => void
  controls: HeroShaderControls
}

type FeedbackPipeline = {
  targets: WebGLRenderTarget[]
  blurTargets: WebGLRenderTarget[]
  feedback: RawShaderMaterial
  blur: RawShaderMaterial
  feedbackScene: Scene
  blurScene: Scene
  camera: OrthographicCamera
  width: number
  height: number
  index: number
  initialized: boolean
}

const capturedTime = [1.9955107, 3.5206001, 3.5206001] as const

export function HeroShader({ time, progress, heroRef, visible, still, compact, onReady, controls }: HeroShaderProps) {
  const { gl, size, invalidate } = useThree()
  const [textures, setTextures] = useState<Texture[] | null>(null)
  const material = useRef<RawShaderMaterial>(null)
  const inspect = useRef<RawShaderMaterial>(null)
  const mainMesh = useRef<Mesh>(null)
  const inspectMesh = useRef<Mesh>(null)
  const captured = useRef(false)
  const pendingCapture = useRef(false)
  const pendingReady = useRef(false)
  const pipeline = useRef<FeedbackPipeline | null>(null)
  const elapsed = useRef(0)
  const previousTime = useRef<number | null>(null)
  const frame = useRef(0)
  const heroHeight = useRef(1)
  const clearColor = useRef(new Color())
  const mouse = useRef(new Vector2(.5, .5))
  const lastMouse = useRef(new Vector2(.5, .5))
  const lastInput = useRef(0)
  const hover = useMotionValue(0)
  const velocity = useMotionValue(0)
  const uniforms = useMemo(() => ({
    uScrollProgress: { value: 0 }, uAlpha: { value: 1 }, uExpand: { value: 0 }, uDim: { value: .25 }, vUvScale: { value: 1 },
    uBoostFactor: { value: 80 }, uBoostReveal: { value: 30 }, uSaturation: { value: 3.4886 },
    uMouse: { value: new Vector2() }, uPlane: { value: new Vector2() },
    uTime: { value: new Vector3(...capturedTime) }, uResolution: { value: new Vector3() },
    uMouseProps: { value: new Vector3(.2, 1, 30) },
    uTxt: { value: textures?.[0] ?? null }, uTxtMask: { value: textures?.[1] ?? null },
    uMaskSelection: { value: textures?.[2] ?? null }, uMaskTime: { value: textures?.[3] ?? null },
    uGradientTxt: { value: textures?.[4] ?? null }, uNoiseTxt: { value: textures?.[5] ?? null },
    uTxtLoop: { value: null as Texture | null }, uHeroProgress: { value: 0 }, uHeroHeight: { value: 1 },
  }), [textures])
  const inspectUniforms = useMemo(() => ({
    uInput: { value: null as Texture | null }, uChannel: { value: 4 }, uGain: { value: 1 },
    uHeroProgress: { value: 0 }, uHeroHeight: { value: 1 },
  }), [])

  useEffect(() => addAfterEffect(() => {
    if (pendingReady.current && material.current && visible) {
      pendingReady.current = false
      onReady(true)
    }
    if (!pendingCapture.current || !material.current || !visible) return
    pendingCapture.current = false
    const anchor = document.createElement('a')
    anchor.download = 'hero-shader.png'
    anchor.href = gl.domElement.toDataURL('image/png')
    anchor.click()
  }), [gl, visible, onReady])

  useEffect(() => {
    let cancelled = false
    pendingReady.current = false
    onReady(false)
    const loaded: Texture[] = []
    const manager = new LoadingManager()
    manager.setURLModifier(url => url.endsWith('basis_transcoder.js') ? decoderJsUrl : url.endsWith('basis_transcoder.wasm') ? decoderWasmUrl : url)
    const ktx = new KTX2Loader(manager).setTranscoderPath('hero-basis/').setWorkerLimit(2).detectSupport(gl)
    let decoderDisposed = false
    const disposeDecoder = () => { if (!decoderDisposed) { ktx.dispose(); decoderDisposed = true } }
    const imageLoader = new TextureLoader()
    const keep = (texture: Texture) => {
      if (cancelled) { texture.dispose(); return texture }
      loaded.push(texture)
      return texture
    }
    const compressed = [marbleUrl, revealUrl, selectionUrl, timingUrl].map(async url => {
      const texture = keep(await ktx.loadAsync(url))
      if (cancelled) return texture
      texture.minFilter = texture.magFilter = LinearFilter
      texture.generateMipmaps = false
      texture.wrapS = texture.wrapT = ClampToEdgeWrapping
      texture.needsUpdate = true
      return texture
    })
    const images = [gradientUrl, noiseUrl, perlinUrl].map(async (url, index) => {
      const texture = keep(await imageLoader.loadAsync(url))
      if (cancelled) return texture
      texture.wrapS = texture.wrapT = MirroredRepeatWrapping
      texture.minFilter = LinearMipmapLinearFilter
      texture.magFilter = LinearFilter
      texture.generateMipmaps = true
      texture.colorSpace = index === 0 ? SRGBColorSpace : NoColorSpace
      texture.needsUpdate = true
      return texture
    })
    Promise.allSettled([...compressed, ...images]).then(results => {
      disposeDecoder()
      if (cancelled) return
      const result = results.flatMap(entry => entry.status === 'fulfilled' ? [entry.value] : [])
      if (result.length !== 7) {
        cancelled = true
        loaded.forEach(texture => texture.dispose())
        onReady(false)
        return
      }
      setTextures(result)
      invalidate()
    })
    return () => { cancelled = true; pendingReady.current = false; loaded.forEach(texture => texture.dispose()); manager.abort() }
  }, [gl, invalidate, onReady])

  useEffect(() => {
    if (!textures) return
    pendingReady.current = false
    onReady(false)
    const width = compact ? 384 : 1536
    const height = compact ? 256 : 1024
    const makeTarget = () => new WebGLRenderTarget(width, height, { minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false, stencilBuffer: false, colorSpace: NoColorSpace })
    const targets = [makeTarget(), makeTarget()]
    const blurTargets = [makeTarget(), makeTarget()]
    const feedback = new RawShaderMaterial({ glslVersion: GLSL3, vertexShader, fragmentShader: feedbackShader, depthTest: false, depthWrite: false, toneMapped: false, uniforms: {
      uPrev: { value: targets[0].texture }, uMarble: { value: textures[0] }, uNoise: { value: textures[5] }, uPerlin: { value: textures[6] },
      uMouse: { value: new Vector2(.5, .5) }, uLastMouse: { value: new Vector2(.5, .5) },
      uTime: { value: capturedTime[2] }, uDelta: { value: 1 / 60 }, uHover: { value: 0 }, uVelocity: { value: 0 },
      uRadius: { value: .24 }, uStrength: { value: 2 }, uDecay: { value: .946 }, uIntensity: { value: 2 },
      uOffsetScale: { value: .25 }, uDecayRate: { value: .85 }, uMixFactor: { value: .9 }, uClampMax: { value: 1 },
    } })
    const blur = new RawShaderMaterial({ glslVersion: GLSL3, vertexShader, fragmentShader: blurShader, depthTest: false, depthWrite: false, toneMapped: false, uniforms: {
      uInput: { value: targets[0].texture }, uAxis: { value: new Vector2() },
    } })
    const geometry = new PlaneGeometry(2, 2)
    const feedbackScene = new Scene()
    const blurScene = new Scene()
    feedbackScene.add(new Mesh(geometry, feedback))
    blurScene.add(new Mesh(geometry, blur))
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 2)
    camera.position.z = 1
    const previousTarget = gl.getRenderTarget()
    gl.getClearColor(clearColor.current)
    const alpha = gl.getClearAlpha()
    try {
      gl.setClearColor(0, 1)
      for (const target of [...targets, ...blurTargets]) { gl.setRenderTarget(target); gl.clear() }
    } finally { gl.setRenderTarget(previousTarget); gl.setClearColor(clearColor.current, alpha) }
    pipeline.current = { targets, blurTargets, feedback, blur, feedbackScene, blurScene, camera, width, height, index: 0, initialized: false }
    invalidate()
    return () => {
      pipeline.current = null
      pendingReady.current = false
      targets.forEach(target => target.dispose())
      blurTargets.forEach(target => target.dispose())
      feedback.dispose()
      blur.dispose()
      geometry.dispose()
    }
  }, [textures, compact, gl, invalidate, onReady])

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      if (event.target instanceof Element && event.target.closest('.hero-shader-tools')) { hover.set(0); velocity.set(0); return }
      lastMouse.current.copy(mouse.current)
      mouse.current.set(Math.max(0, Math.min(1, event.clientX / size.width)), 1 - Math.max(0, Math.min(1, event.clientY / size.height)))
      const milliseconds = Math.max(1, event.timeStamp - lastInput.current)
      velocity.set(Math.max(0, Math.min(1, mouse.current.distanceTo(lastMouse.current) * 1000 / milliseconds * .6)))
      lastInput.current = event.timeStamp
      hover.set(1)
      invalidate()
    }
    const leave = () => { hover.set(0); velocity.set(0); invalidate() }
    const measure = () => { heroHeight.current = hero.offsetHeight / size.height; invalidate() }
    const observer = new ResizeObserver(measure)
    observer.observe(hero)
    measure()
    hero.addEventListener('pointerenter', move, { passive: true })
    hero.addEventListener('pointermove', move, { passive: true })
    hero.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    return () => { observer.disconnect(); hero.removeEventListener('pointerenter', move); hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave); window.removeEventListener('blur', leave) }
  }, [heroRef, size.width, size.height, hover, velocity, invalidate])

  useEffect(() => { previousTime.current = null; if (!still) captured.current = false; invalidate() }, [still, visible, invalidate])
  useMotionValueEvent(progress, 'change', () => invalidate())
  useMotionValueEvent(controls.speed, 'change', () => invalidate())
  useMotionValueEvent(controls.strength, 'change', () => invalidate())
  useMotionValueEvent(controls.brightness, 'change', () => invalidate())
  useMotionValueEvent(controls.view, 'change', () => invalidate())
  useMotionValueEvent(controls.snapshot, 'change', () => { elapsed.current = 0; captured.current = true; invalidate() })
  useMotionValueEvent(controls.exportPng, 'change', () => { pendingCapture.current = true; invalidate() })

  useFrame(() => {
    const now = time.get()
    const delta = previousTime.current === null ? 0 : Math.max(0, Math.min(.045, (now - previousTime.current) / 1000))
    previousTime.current = now
    const resources = pipeline.current
    if (!material.current || !resources || !visible) return
    const active = resources.initialized && !still && !captured.current && !document.hidden
    if (active) elapsed.current += delta * controls.speed.get()
    const view = controls.view.get()
    if (mainMesh.current) mainMesh.current.visible = view === 0
    if (inspectMesh.current) inspectMesh.current.visible = view !== 0
    const values = material.current.uniforms
    values.uTime.value.set(capturedTime[0] + elapsed.current * .36, capturedTime[1] + elapsed.current, capturedTime[2] + elapsed.current)
    values.uPlane.value.set(size.width, size.height)
    values.uResolution.value.set(size.width, size.height, gl.getPixelRatio())
    values.uMouse.value.copy(mouse.current).multiplyScalar(2).subScalar(1)
    values.uHeroProgress.value = progress.get()
    values.uHeroHeight.value = heroHeight.current
    values.uDim.value = controls.brightness.get()
    values.uMouseProps.value.y = controls.strength.get()
    const feedback = resources.feedback.uniforms
    feedback.uMouse.value.copy(mouse.current)
    feedback.uLastMouse.value.copy(lastMouse.current)
    feedback.uStrength.value = controls.strength.get()
    if (active) {
      feedback.uHover.value += (hover.get() - feedback.uHover.value) * Math.min(1, delta * 7)
      feedback.uVelocity.value += (velocity.get() - feedback.uVelocity.value) * Math.min(1, delta * 12)
    }
    if (!resources.initialized || active && frame.current % 2 === 0) {
      const previousTarget = gl.getRenderTarget()
      gl.getClearColor(clearColor.current)
      const alpha = gl.getClearAlpha()
      try {
        gl.setClearColor(0, 1)
        const next = 1 - resources.index
        feedback.uPrev.value = resources.targets[resources.index].texture
        feedback.uTime.value = values.uTime.value.z
        feedback.uDelta.value = resources.initialized ? delta * 2 : 1 / 60
        gl.setRenderTarget(resources.targets[next])
        gl.render(resources.feedbackScene, resources.camera)
        resources.index = next
        let input = resources.targets[next].texture
        for (let iteration = 0; iteration < (compact ? 1 : 2); iteration++) {
          resources.blur.uniforms.uInput.value = input
          resources.blur.uniforms.uAxis.value.set(1 / resources.width, 0)
          gl.setRenderTarget(resources.blurTargets[0])
          gl.render(resources.blurScene, resources.camera)
          resources.blur.uniforms.uInput.value = resources.blurTargets[0].texture
          resources.blur.uniforms.uAxis.value.set(0, 1 / resources.height)
          gl.setRenderTarget(resources.blurTargets[1])
          gl.render(resources.blurScene, resources.camera)
          input = resources.blurTargets[1].texture
        }
        values.uTxtLoop.value = input
        if (!resources.initialized) { resources.initialized = true; pendingReady.current = true }
      } finally { gl.setRenderTarget(previousTarget); gl.setClearColor(clearColor.current, alpha) }
    }
    if (active) frame.current++
    if (inspect.current) {
      const debug = inspect.current.uniforms
      debug.uInput.value = view === 1 ? textures?.[0] : view === 2 ? textures?.[1] : view === 3 ? textures?.[2] : view === 4 ? textures?.[3] : view === 5 ? textures?.[4] : view === 6 ? textures?.[5] : view === 7 ? resources.targets[resources.index].texture : values.uTxtLoop.value
      debug.uChannel.value = view === 2 || view === 6 || view === 7 || view === 8 ? 0 : view === 3 ? 1 : view === 4 ? 2 : 4
      debug.uHeroProgress.value = progress.get()
      debug.uHeroHeight.value = heroHeight.current
    }
  }, -1)

  if (!textures) return null
  return <group visible={visible}>
  <mesh ref={mainMesh} frustumCulled={false} renderOrder={-5}>
    <planeGeometry args={[2, 2]} />
    <rawShaderMaterial ref={material} glslVersion={GLSL3} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthTest={false} depthWrite={false} toneMapped={false} />
  </mesh>
  <mesh ref={inspectMesh} visible={false} frustumCulled={false} renderOrder={-5}>
    <planeGeometry args={[2, 2]} />
    <rawShaderMaterial ref={inspect} glslVersion={GLSL3} uniforms={inspectUniforms} vertexShader={vertexShader} fragmentShader={inspectShader} transparent depthTest={false} depthWrite={false} toneMapped={false} />
  </mesh>
  </group>
}
