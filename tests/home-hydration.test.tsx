import { expect, spyOn, test } from 'bun:test'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { CapabilityArtwork } from '../src/components/home/cinematic/capabilities/CapabilityArtwork'

test('capability SVGs hydrate identically when browser trigonometry differs in its last bits', async () => {
  const artwork = <div>{(['connections', 'performance', 'motion'] as const).map(kind => <CapabilityArtwork key={kind} kind={kind} />)}</div>
  const markup = renderToString(artwork)
  const container = document.createElement('div')
  container.innerHTML = markup
  document.body.append(container)
  const sine = Math.sin
  const cosine = Math.cos
  const sin = spyOn(Math, 'sin').mockImplementation(angle => sine(angle) * (1 + Number.EPSILON))
  const cos = spyOn(Math, 'cos').mockImplementation(angle => cosine(angle) * (1 + Number.EPSILON))
  const errors = spyOn(console, 'error').mockImplementation(() => {})
  let root: ReturnType<typeof hydrateRoot> | undefined
  try {
    expect(renderToString(artwork)).toBe(markup)
    await act(async () => { root = hydrateRoot(container, artwork) })
    expect(errors).not.toHaveBeenCalled()
  } finally {
    if (root) await act(async () => root?.unmount())
    sin.mockRestore(); cos.mockRestore(); errors.mockRestore()
    container.remove()
  }
})
