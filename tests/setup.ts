import { Window } from 'happy-dom'
import { plugin } from 'bun'
import { shaderDiscovery } from '../scripts/shaders/bun-discovery'

plugin(shaderDiscovery())

const browser = new Window({ url: 'http://localhost:3000' })
const globals = ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'HTMLButtonElement', 'SVGElement', 'Element', 'Node', 'NodeFilter', 'Text', 'Document', 'DocumentFragment', 'ShadowRoot', 'Event', 'CustomEvent', 'MouseEvent', 'PointerEvent', 'KeyboardEvent', 'FocusEvent', 'MutationObserver', 'ResizeObserver', 'DOMParser', 'Range', 'Selection']
for (const key of globals) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === 'window' ? browser : browser[key as keyof Window] })
for (const key of ['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'] as const) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: browser[key].bind(browser) })
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, writable: true, value: true })
