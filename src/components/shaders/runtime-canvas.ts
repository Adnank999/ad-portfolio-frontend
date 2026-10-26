export function createShaderCanvas(container: HTMLElement) {
  const canvas = document.createElement('canvas')
  canvas.className = 'absolute inset-0 block h-full w-full'
  canvas.setAttribute('aria-hidden', 'true')
  container.appendChild(canvas)
  return canvas
}

export function failShaderCanvas(canvas: HTMLCanvasElement, context: WebGL2RenderingContext | null, message: string): never {
  canvas.remove()
  context?.getExtension('WEBGL_lose_context')?.loseContext()
  throw new Error(message)
}
