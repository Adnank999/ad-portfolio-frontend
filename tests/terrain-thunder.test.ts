import { describe, expect, mock, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { createThunderSampleSets, mixThunderSamples } from '../src/components/terrain-recreation/engine/thunder-mixes.js'
import { createThunderAudio } from '../src/components/terrain-recreation/engine/thunder-audio.js'
import { createSceneAudio } from '../src/components/terrain-recreation/engine/scene-audio.js'
import { DEFAULT_SETTINGS } from '../src/components/terrain-recreation/engine/scene.js'

function audioParameter() {
  return {
    value: 1,
    cancelScheduledValues: mock(() => {}), setTargetAtTime: mock(() => {}),
    setValueAtTime: mock(() => {}), exponentialRampToValueAtTime: mock(() => {}),
    linearRampToValueAtTime: mock(() => {}),
  }
}

function audioBuffer(channels = 1, length = 1000, sampleRate = 1000, amplitude = .6) {
  const data = Array.from({ length: channels }, () => new Float32Array(length).fill(amplitude))
  return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate, getChannelData: (channel: number) => data[channel] }
}

function eventHub() {
  const listeners = new Map<string, Set<() => void>>()
  return {
    hidden: false,
    addEventListener: (name: string, callback: () => void) => {
      if (!listeners.has(name)) listeners.set(name, new Set())
      listeners.get(name)!.add(callback)
    },
    removeEventListener: (name: string, callback: () => void) => { listeners.get(name)?.delete(callback) },
    emit: (name: string) => { listeners.get(name)?.forEach(callback => callback()) },
  }
}

function audioHarness() {
  const node = () => ({ connect: mock(() => {}), disconnect: mock(() => {}) })
  const sources: Array<ReturnType<typeof makeSource>> = []
  const gains: Array<ReturnType<typeof audioParameter>> = []
  function makeSource() {
    return { ...node(), buffer: null as ReturnType<typeof audioBuffer> | null, playbackRate: audioParameter(),
      onended: null as (() => void) | null, start: mock(() => {}), stop: mock(() => {}) }
  }
  const context = {
    state: 'running', currentTime: 0, sampleRate: 1000, destination: node(),
    createGain: () => { const gain = audioParameter(); gains.push(gain); return { ...node(), gain } },
    createDynamicsCompressor: () => ({ ...node(), threshold: audioParameter(), knee: audioParameter(), ratio: audioParameter(), attack: audioParameter(), release: audioParameter() }),
    createStereoPanner: () => ({ ...node(), pan: audioParameter() }),
    createBuffer: (channels: number, length: number, rate: number) => audioBuffer(channels, length, rate, 0),
    createBufferSource: () => { const source = makeSource(); sources.push(source); return source },
    createMediaElementSource: () => node(),
    decodeAudioData: mock(async (_data: ArrayBuffer) => audioBuffer()),
    resume: async () => { context.state = 'running' },
    suspend: async () => { context.state = 'suspended' },
    close: async () => { context.state = 'closed' },
    addEventListener: mock(() => {}), removeEventListener: mock(() => {}),
  }
  const target = { ...eventHub(), document: eventHub() }
  const load = mock(async (_url: string, _signal: AbortSignal) => new ArrayBuffer(4))
  const createContext = mock(() => context)
  return { context, sources, gains, target, load, createContext }
}

const sampleSets = createThunderSampleSets('/terrain/audio/')

describe('terrain thunder mixes', () => {
  test('uses the six supplied recordings, with normalized mix weights and base-aware paths', () => {
    expect(sampleSets.showcase.map(layer => layer.url.split('/').at(-1))).toEqual(['low-thunder.mp3', 'medium-thunder.mp3', 'big-thunder.mp3'])
    expect(sampleSets.details.map(layer => layer.url.split('/').at(-1))).toEqual(['medium-thunder-project-details.mp3', 'medium-thunder-2-project-details.mp3', 'medium-thunder-3-project-details.mp3'])
    for (const layers of Object.values(sampleSets)) {
      expect(layers.reduce((total, layer) => total + layer.gain, 0)).toBe(1)
      for (const layer of layers) expect(existsSync(new URL(`../public${layer.url}`, import.meta.url))).toBe(true)
    }
    expect(createThunderSampleSets('/portfolio/terrain/audio').details[0].url).toBe('/portfolio/terrain/audio/thunder/medium-thunder-project-details.mp3')
  })

  test('pre-mixes layers without adding their peaks, preserves stereo and fades layer boundaries', () => {
    const { context } = audioHarness()
    const buffer = mixThunderSamples(context, [
      { buffer: audioBuffer(1), gain: .5, delay: 0 },
      { buffer: audioBuffer(2), gain: .3, delay: .1 },
      { buffer: audioBuffer(1), gain: .2, delay: .2 },
    ])!
    expect(buffer.numberOfChannels).toBe(2)
    expect(buffer.duration).toBe(1.2)
    expect(buffer.getChannelData(0)[0]).toBe(0)
    expect(buffer.getChannelData(0)[400]).toBeCloseTo(.6)
    expect(buffer.getChannelData(1)[400]).toBeCloseTo(.6)
    expect(Math.max(...buffer.getChannelData(0))).toBeLessThan(.601)
    expect(buffer.getChannelData(0).at(-1)).toBe(0)
    expect(mixThunderSamples(context, [])).toBeNull()
  })

  test('decodes and caches each mix once, and plays a single buffer per lightning strike', async () => {
    const harness = audioHarness()
    const thunder = createThunderAudio({ sampleSets, autoUnlock: false, eventTarget: harness.target, createContext: harness.createContext, loadSample: harness.load })
    await thunder.unlock()
    expect(thunder.getState().volume).toBe(.3)
    expect(harness.load).toHaveBeenCalledTimes(6)
    expect(harness.context.decodeAudioData).toHaveBeenCalledTimes(3)
    expect(await thunder.strike({ strength: 1, delay: .12 })).toBe(true)
    expect(harness.sources).toHaveLength(1)
    expect(harness.sources[0].start).toHaveBeenCalledWith(.12, 0)
    expect(thunder.getState().sampleUrls).toEqual(sampleSets.showcase.map(layer => layer.url))
    thunder.setSampleSet('details'); await thunder.whenReady()
    expect(harness.sources[0].stop).toHaveBeenCalled()
    expect(thunder.getState().activeVoices).toBe(0)
    expect(harness.context.decodeAudioData).toHaveBeenCalledTimes(6)
    expect(thunder.getState().sampleUrls).toEqual(sampleSets.details.map(layer => layer.url))
    thunder.setSampleSet('showcase'); await thunder.whenReady()
    expect(harness.context.decodeAudioData).toHaveBeenCalledTimes(6)
    expect(harness.createContext).toHaveBeenCalledTimes(1)
    thunder.dispose()
    expect(harness.context.state).toBe('closed')
  })

  test('cancels pending old-page strikes, respects mute/visibility, and disposes all voices', async () => {
    const harness = audioHarness()
    const thunder = createThunderAudio({ sampleSets, autoUnlock: false, eventTarget: harness.target, createContext: harness.createContext, loadSample: harness.load })
    await thunder.unlock()
    const oldStrike = thunder.strike()
    thunder.setSampleSet('details')
    expect(await oldStrike).toBe(false)
    await thunder.whenReady(); expect(await thunder.strike()).toBe(true)
    thunder.setEnabled(false)
    expect(await thunder.strike()).toBe(false)
    expect(thunder.getState().activeVoices).toBe(0)
    thunder.setEnabled(true); await thunder.unlock(); await thunder.strike()
    harness.target.document.hidden = true; harness.target.document.emit('visibilitychange')
    expect(thunder.getState().activeVoices).toBe(0)
    expect(harness.context.state).toBe('suspended')
    thunder.dispose()
    expect(harness.load.mock.calls[0][1].aborted).toBe(true)
    expect(thunder.getState().sampleUrls).toEqual([])
  })

  test('uses remaining layers if a recording fails instead of silencing every thunder strike', async () => {
    const harness = audioHarness()
    const errors = mock((_message: string) => {})
    const thunder = createThunderAudio({ sampleSets, autoUnlock: false, eventTarget: harness.target, createContext: harness.createContext,
      loadSample: async (url: string) => { if (url.endsWith('/big-thunder.mp3')) throw new Error('Unavailable'); return new ArrayBuffer(4) }, onError: errors })
    expect(await thunder.unlock()).toBe(true)
    expect(await thunder.strike()).toBe(true)
    expect(errors.mock.calls[0][0]).toContain('big-thunder.mp3')
    thunder.dispose()
  })

  test('keeps the legacy single-recording API working', async () => {
    const harness = audioHarness()
    const thunder = createThunderAudio({ sampleUrl: '/legacy.mp3', autoUnlock: false, eventTarget: harness.target, createContext: harness.createContext, loadSample: harness.load })
    await thunder.unlock()
    expect(await thunder.strike()).toBe(true)
    expect(thunder.getState().sampleUrl).toBe('/legacy.mp3')
    expect(thunder.setSampleSet('missing')).toBe(false)
    thunder.dispose()
  })

  test('smoothly fades both thunder banks in and out without changing strike timing', async () => {
    const harness = audioHarness()
    const thunder = createThunderAudio({ sampleSets, autoUnlock: false, eventTarget: harness.target, createContext: harness.createContext, loadSample: harness.load })
    await thunder.unlock()
    for (const bank of ['showcase', 'details']) {
      thunder.setSampleSet(bank); await thunder.whenReady()
      expect(await thunder.strike({ strength: .8, delay: .12 })).toBe(true)
      const envelope = harness.gains.at(-1)!
      const source = harness.sources.at(-1)!
      const duration = thunder.getState().duration
      expect(envelope.setValueAtTime.mock.calls[0]).toEqual([.0001, .12])
      expect(envelope.linearRampToValueAtTime.mock.calls[0][0]).toBe(.8)
      expect(envelope.linearRampToValueAtTime.mock.calls[0][1]).toBeCloseTo(.12 + Math.min(.3, duration * .15))
      expect(envelope.setValueAtTime.mock.calls[1][0]).toBe(.8)
      expect(envelope.setValueAtTime.mock.calls[1][1]).toBeCloseTo(.12 + duration - Math.min(2.2, duration * .5))
      expect(envelope.exponentialRampToValueAtTime.mock.calls[0][0]).toBe(.0001)
      expect(envelope.exponentialRampToValueAtTime.mock.calls[0][1]).toBeCloseTo(.12 + duration)
      expect(source.start).toHaveBeenCalledWith(.12, 0)
      expect(source.stop.mock.calls[0][0]).toBeCloseTo(.12 + duration)
    }
    thunder.dispose()
  })

  test('keeps fade automation ordered for short clips and late-starting strikes', async () => {
    for (const duration of [.04, 4.4]) {
      const harness = audioHarness()
      harness.context.decodeAudioData = mock(async () => audioBuffer(1, duration * 1000))
      const thunder = createThunderAudio({ sampleUrl: '/thunder.mp3', autoUnlock: false, eventTarget: harness.target, createContext: harness.createContext, loadSample: harness.load })
      await thunder.unlock()
      const pending = thunder.strike({ delay: .12 })
      harness.context.currentTime = duration === .04 ? 0 : 4.48
      expect(await pending).toBe(true)
      const envelope = harness.gains.at(-1)!
      const start = envelope.setValueAtTime.mock.calls[0][1]
      const attackEnd = envelope.linearRampToValueAtTime.mock.calls[0][1]
      const releaseStart = envelope.setValueAtTime.mock.calls[1][1]
      const end = envelope.exponentialRampToValueAtTime.mock.calls[0][1]
      expect(start).toBeLessThan(attackEnd)
      expect(attackEnd).toBeLessThan(releaseStart)
      expect(releaseStart).toBeLessThan(end)
      expect(harness.sources[0].start).toHaveBeenCalledWith(start, start - .12)
      expect(end).toBeCloseTo(.12 + duration)
      thunder.dispose()
    }
  })

  test('details select the quiet mix from startup and keep background music paused', async () => {
    const harness = audioHarness()
    const createMedia = () => ({ loop: false, preload: 'none', volume: 1, muted: false, src: '', currentTime: 0, paused: true,
      async play() { this.paused = false }, pause() { this.paused = true }, load() {}, removeAttribute() {}, addEventListener() {}, removeEventListener() {} })
    const audio = createSceneAudio({ thunderSets: sampleSets, detailMode: true, musicUrl: '/music.mp3', portalUrl: '/portal.mp3',
      settings: { ...DEFAULT_SETTINGS },
      createMedia, eventTarget: harness.target, createContext: harness.createContext, loadThunder: harness.load, fetchMusic: async () => new Blob(['music']) })
    await audio.unlock(); await audio.whenReady()
    expect(audio.getState().sampleSet).toBe('details')
    expect(audio.getState().volume).toBe(.1)
    expect(audio.getState().music.playing).toBe(false)
    audio.setDetailMode(false); await audio.unlock()
    expect(audio.getState().sampleSet).toBe('showcase')
    expect(audio.getState().volume).toBe(.3)
    expect(audio.getState().music.playing).toBe(true)
    audio.setDetailMode(true)
    expect(audio.getState().music.playing).toBe(false)
    expect(audio.getState().volume).toBe(.1)
    audio.dispose()
    expect(harness.createContext).toHaveBeenCalledTimes(1)
  })
})
