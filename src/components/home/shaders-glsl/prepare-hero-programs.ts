import type { Camera, Object3D, Texture, WebGLRenderer } from 'three'

/** Link without querying blocking uniforms, then upload one texture per task. */
export function prepareHeroPrograms(
  renderer: WebGLRenderer,
  scenes: { scene: Object3D; camera: Camera }[],
  textures: Texture[],
  ready: () => void,
  failed: (error: unknown) => void,
) {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let idle: number | undefined
  const context = renderer.getContext()
  const extension = renderer.extensions.get('KHR_parallel_shader_compile') as { COMPLETION_STATUS_KHR: number } | null
  const run = (work: () => void) => {
    if (cancelled || context.isContextLost()) return
    try { work() } catch (error) { cancelled = true; failed(error) }
  }
  const schedule = (work: () => void) => {
    timer = setTimeout(() => {
      if (cancelled || context.isContextLost()) return
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(() => run(work), { timeout: 500 })
      else run(work)
    }, 0)
  }
  let sceneIndex = 0
  let textureIndex = 0
  const upload = () => {
    if (textureIndex < textures.length) {
      renderer.initTexture(textures[textureIndex++])
      schedule(upload)
    } else ready()
  }
  const waitForPrograms = () => {
    const pending = extension && renderer.info.programs?.some(program => program.program
      && !context.getProgramParameter(program.program as WebGLProgram, extension.COMPLETION_STATUS_KHR))
    if (pending) timer = setTimeout(waitForProgramsIfActive, 10)
    else schedule(upload)
  }
  const waitForProgramsIfActive = () => run(waitForPrograms)
  const compile = () => {
    if (sceneIndex < scenes.length) {
      const { scene, camera } = scenes[sceneIndex++]
      renderer.compile(scene, camera)
      schedule(compile)
    } else waitForPrograms()
  }
  schedule(compile)
  return () => {
    cancelled = true
    clearTimeout(timer)
    if (idle !== undefined) window.cancelIdleCallback(idle)
  }
}
