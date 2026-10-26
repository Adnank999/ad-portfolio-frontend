import { useEffect, useRef } from 'react'
import { definition } from '../definitions/gradient-flow'
import type { JsonObject } from '@/server/portfolio-content'

const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`
const fragment = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float elapsed;
uniform float amplitude;
uniform float blend;
uniform float vertical;
uniform int count;
uniform vec3 colors[5];
out vec4 outputColor;
void main() {
  vec2 point = gl_FragCoord.xy / resolution;
  float axis = mix(point.x, point.y, vertical);
  float crossAxis = mix(point.y, point.x, vertical);
  float wave = sin(crossAxis * 6.0 + elapsed) * 0.13 + sin(axis * 9.0 - elapsed * 0.6) * 0.07;
  float phase = clamp(axis + wave * amplitude, 0.0, 0.9999) * float(count - 1);
  int index = min(int(floor(phase)), count - 2);
  float transition = mix(step(0.5, fract(phase)), smoothstep(0.0, 1.0, fract(phase)), max(blend, 0.02));
  vec3 color = mix(colors[index], colors[index + 1], transition);
  float light = 0.72 + 0.28 * sin(crossAxis * 3.14159);
  outputColor = vec4(color * light, 1.0);
}`

export default function GradientFlowAdapter(props: JsonObject) {
  const container = useRef<HTMLDivElement>(null)
  const settings = useRef(definition.schema.parse(props))
  settings.current = definition.schema.parse(props)
  useEffect(() => {
    const element = document.createElement('canvas')
    element.className = 'block h-full w-full'
    element.setAttribute('aria-hidden', 'true')
    container.current!.appendChild(element)
    const context = element.getContext('webgl2', { alpha: false, antialias: false })
    if (!context) { element.remove(); throw new Error('WebGL2 unavailable') }
    const shaders: WebGLShader[] = []
    const program = context.createProgram()!
    const buffer = context.createBuffer()!
    let animation = 0
    let resize: ResizeObserver | undefined
    const dispose = () => {
      cancelAnimationFrame(animation)
      resize?.disconnect()
      context.deleteBuffer(buffer)
      context.deleteProgram(program)
      shaders.forEach(shader => context.deleteShader(shader))
      element.remove()
      context.getExtension('WEBGL_lose_context')?.loseContext()
    }
    try {
      for (const [kind, source] of [[context.VERTEX_SHADER, vertex], [context.FRAGMENT_SHADER, fragment]] as const) {
        const stage = kind === context.VERTEX_SHADER ? 'vertex' : 'fragment'
        const shader = context.createShader(kind)
        if (!shader) throw new Error(`Gradient ${stage} shader allocation failed${context.isContextLost() ? ': WebGL context lost' : ''}`)
        shaders.push(shader)
        context.shaderSource(shader, source)
        context.compileShader(shader)
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
          const details = context.isContextLost() ? 'WebGL context lost' : context.getShaderInfoLog(shader)?.trim() || 'No compiler diagnostics available'
          throw new Error(`Gradient ${stage} shader compilation failed: ${details}`)
        }
        context.attachShader(program, shader)
      }
      context.linkProgram(program)
      if (!context.getProgramParameter(program, context.LINK_STATUS)) {
        const details = context.isContextLost() ? 'WebGL context lost' : context.getProgramInfoLog(program)?.trim() || 'No linker diagnostics available'
        throw new Error(`Gradient shader linking failed: ${details}`)
      }
      context.useProgram(program)
      context.bindBuffer(context.ARRAY_BUFFER, buffer)
      context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW)
      const position = context.getAttribLocation(program, 'position')
      context.enableVertexAttribArray(position)
      context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0)
      const uniforms = Object.fromEntries(['resolution', 'elapsed', 'amplitude', 'blend', 'vertical', 'count', 'colors[0]'].map(name => [name, context.getUniformLocation(program, name)]))
      resize = new ResizeObserver(() => {
        element.width = Math.max(1, Math.round(element.clientWidth * Math.min(window.devicePixelRatio || 1, 1.5)))
        element.height = Math.max(1, Math.round(element.clientHeight * Math.min(window.devicePixelRatio || 1, 1.5)))
      })
      resize.observe(element)
      let previous = 0
      let elapsed = 0
      const render = (time: number) => {
        const current = settings.current
        elapsed += previous ? Math.min((time - previous) / 1000, 0.05) * current.speed : 0
        previous = time
        const colors = Array.from({ length: 5 }, (_, index) => current.colorStops[Math.min(index, current.colorStops.length - 1)]).flatMap(color => [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16) / 255))
        context.viewport(0, 0, element.width, element.height)
        context.uniform2f(uniforms.resolution, element.width, element.height)
        context.uniform1f(uniforms.elapsed, elapsed)
        context.uniform1f(uniforms.amplitude, current.amplitude)
        context.uniform1f(uniforms.blend, current.blend)
        context.uniform1f(uniforms.vertical, current.direction === 'vertical' ? 1 : 0)
        context.uniform1i(uniforms.count, current.colorStops.length)
        context.uniform3fv(uniforms['colors[0]'], colors)
        context.drawArrays(context.TRIANGLES, 0, 3)
        animation = requestAnimationFrame(render)
      }
      animation = requestAnimationFrame(render)
      return dispose
    } catch (error) { dispose(); throw error }
  }, [])
  return <div ref={container} className="h-full w-full" />
}
