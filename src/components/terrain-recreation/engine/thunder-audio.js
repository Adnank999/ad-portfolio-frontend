import { mixThunderSamples } from './thunder-mixes.js';

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function createThunderAudio({ enabled = true, volume = .30, eventTarget = globalThis,
  autoUnlock = true, onContext = () => {}, sampleUrl, sampleSets, sampleSet = 'showcase', onError = () => {},
  loadSample = async (url, signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok || response.status === 204) throw new Error(`HTTP ${response.status}`);
    const data = await response.arrayBuffer();
    if (!data.byteLength) throw new Error('Empty audio response');
    return data;
  },
  createContext = () => {
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    return AudioContext ? new AudioContext() : null;
  } } = {}) {
  let context = null, master = null, compressor = null, noise = null, resuming = null;
  let disposed = false, available = true, generation = 0;
  const controller = new AbortController();
  const definitions = sampleSets && Object.keys(sampleSets).length ? sampleSets : { default: sampleUrl ? [{ url: sampleUrl, gain: 1, delay: 0 }] : [] };
  const banks = new Map(Object.entries(definitions).map(([name, layers]) => {
    const bank = { layers, buffer: null, ready: null, state: layers.length ? 'loading' : 'unused', data: null };
    bank.data = Promise.all(layers.map(layer => Promise.resolve().then(() => loadSample(layer.url, controller.signal))
      .then(data => disposed ? null : { ...layer, data })
      .catch(error => {
        if (!disposed && error?.name !== 'AbortError') onError(`Thunder sound (${layer.url}): ${error.message}`);
        return null;
      }))).then(loaded => {
      const available = loaded.filter(Boolean);
      if (!disposed && layers.length) bank.state = available.length ? 'loaded' : 'error';
      return available;
    });
    return [name, bank];
  }));
  let activeSet = banks.has(sampleSet) ? sampleSet : banks.keys().next().value;
  const getBank = () => banks.get(activeSet);
  const voices = new Set();

  function stopVoices() {
    generation++;
    for (const voice of voices) {
      voice.source.onended = null;
      voice.source.stop();
      voice.nodes.forEach(node => node.disconnect());
    }
    voices.clear();
  }

  function prepareSample(bank = getBank()) {
    if (!bank?.layers.length) return Promise.resolve(true);
    if (!bank.ready) bank.ready = bank.data.then(async loaded => {
      if (disposed) return false;
      const decoded = await Promise.all(loaded.map(async layer => {
        try {
          const buffer = await context.decodeAudioData(layer.data);
          if (!Number.isFinite(buffer.duration) || buffer.duration <= .02) throw new Error('Invalid recording duration');
          return { buffer, gain: layer.gain ?? 1, delay: Math.max(0, layer.delay || 0) };
        } catch (error) {
          if (!disposed) onError(`Thunder sound (${layer.url}): ${error.message}`);
          return null;
        }
      }));
      if (disposed) return false;
      bank.buffer = mixThunderSamples(context, decoded.filter(Boolean));
      bank.state = bank.buffer ? 'ready' : 'error';
      return Boolean(bank.buffer);
    }).catch(error => {
      if (!disposed) { bank.state = 'error'; onError(`Thunder sound: ${error.message}`); }
      return false;
    });
    return bank.ready;
  }

  function unlock({ force = false } = {}) {
    if (disposed || (!enabled && !force) || !available) return Promise.resolve(false);
    try {
      if (!context) {
        context = createContext();
        if (!context) { available = false; return Promise.resolve(false); }
        master = context.createGain();
        master.gain.value = clamp(volume, 0, 1);
        compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -9;
        compressor.knee.value = 14;
        compressor.ratio.value = 6;
        compressor.attack.value = .004;
        compressor.release.value = .35;
        master.connect(compressor);
        compressor.connect(context.destination);
        if (!getBank()?.layers.length) {
          noise = context.createBuffer(2, Math.ceil(context.sampleRate * 6), context.sampleRate);
          for (let channel = 0; channel < 2; channel++) {
            const samples = noise.getChannelData(channel);
            let low = 0, middle = 0;
            for (let index = 0; index < samples.length; index++) {
              const white = Math.random() * 2 - 1;
              low = low * .987 + white * .013;
              middle = middle * .83 + white * .17;
              const seconds = index / context.sampleRate;
              const rolling = .55 + .25 * Math.sin(seconds * 7.3 + channel)
                + .2 * Math.sin(seconds * 13.7 + .8);
              const crack = Math.exp(-seconds * 18) * white * .32;
              const fade = Math.min(1, seconds / .012, (6 - seconds) / .6);
              samples[index] = clamp(((low * 3.8 + middle * .35) * rolling + crack) * fade, -.95, .95);
            }
          }
        }
        onContext({ context, destination: compressor });
      }
      const ready = prepareSample();
      if (context.state === 'running') return ready.then(loaded => loaded && !disposed);
      resuming = context.resume().then(() => context.state === 'running')
        .catch(() => false).finally(() => { resuming = null; });
      return Promise.all([resuming, ready]).then(([running, loaded]) => running && loaded && !disposed);
    } catch {
      available = false;
      return Promise.resolve(false);
    }
  }

  function strike({ strength = 1, pan = 0, delay = .12 } = {}) {
    if (disposed || !enabled || volume <= 0 || !context || eventTarget.document?.hidden) return Promise.resolve(false);
    const requestedStart = context.currentTime + clamp(delay, .02, 1), requestedGeneration = generation;
    const bank = getBank();
    return Promise.all([resuming || Promise.resolve(context.state === 'running'), prepareSample(bank)]).then(([running, loaded]) => {
      if (!running || !loaded || context.state !== 'running' || disposed || !enabled || volume <= 0 || requestedGeneration !== generation || eventTarget.document?.hidden || strength <= 0) return false;
      if (voices.size >= 3) return false;
      const sample = bank?.buffer;
      const duration = sample ? sample.duration : 6.6;
      const start = Math.max(context.currentTime, requestedStart), offset = start - requestedStart;
      if (offset >= duration - .02) return false;
      const source = context.createBufferSource();
      source.buffer = sample || noise;
      source.playbackRate.value = sample ? 1 : .92 + Math.random() * .14;
      const envelope = context.createGain();
      const panner = context.createStereoPanner();
      panner.pan.value = clamp(pan, -.7, .7);
      const power = clamp(strength, 0, 1.5);
      const nodes = [source, envelope, panner];
      if (sample) {
        const end = start + duration - offset;
        const remaining = end - start;
        const fadeIn = Math.min(.3, remaining * .15);
        const fadeOut = Math.min(2.2, remaining * .5);
        const peak = Math.max(.0001, power);
        envelope.gain.setValueAtTime(.0001, start);
        envelope.gain.linearRampToValueAtTime(peak, start + fadeIn);
        envelope.gain.setValueAtTime(peak, end - fadeOut);
        envelope.gain.exponentialRampToValueAtTime(.0001, end);
        source.connect(envelope);
      } else {
        const highpass = context.createBiquadFilter();
        highpass.type = 'highpass'; highpass.frequency.value = 28;
        const lowpass = context.createBiquadFilter();
        lowpass.type = 'lowpass'; lowpass.Q.value = .65;
        lowpass.frequency.setValueAtTime(1150, start);
        lowpass.frequency.exponentialRampToValueAtTime(110, start + 5.5);
        envelope.gain.setValueAtTime(.0001, start);
        envelope.gain.linearRampToValueAtTime(Math.max(.0001, .85 * power), start + .3);
        envelope.gain.exponentialRampToValueAtTime(Math.max(.0001, .45 * power), start + .65);
        envelope.gain.exponentialRampToValueAtTime(Math.max(.0001, .24 * power), start + 1.8);
        envelope.gain.exponentialRampToValueAtTime(.0001, start + 6.5);
        source.connect(highpass); highpass.connect(lowpass); lowpass.connect(envelope);
        nodes.push(highpass, lowpass);
      }
      envelope.connect(panner); panner.connect(master);
      const voice = { source, nodes, end: start + duration - offset };
      voices.add(voice);
      source.onended = () => { voice.nodes.forEach(node => node.disconnect()); voices.delete(voice); };
      source.start(start, offset);
      source.stop(voice.end);
      return true;
    });
  }

  const onGesture = () => { void unlock(); };
  const onVisibility = () => {
    if (eventTarget.document?.hidden) {
      stopVoices();
      if (context?.state === 'running') void context.suspend().catch(() => {});
    }
  };
  if (autoUnlock) {
    eventTarget.addEventListener?.('pointerdown', onGesture, true);
    eventTarget.addEventListener?.('keydown', onGesture, true);
  }
  eventTarget.document?.addEventListener('visibilitychange', onVisibility);

  return {
    unlock, strike,
    whenReady: () => {
      const bank = getBank();
      return bank?.ready || bank?.data.then(loaded => !bank.layers.length || loaded.length > 0) || Promise.resolve(false);
    },
    setSampleSet(name) {
      if (disposed || !banks.has(name)) return false;
      if (activeSet === name) return true;
      stopVoices(); activeSet = name;
      if (context) void prepareSample();
      return true;
    },
    setEnabled(value) {
      enabled = Boolean(value);
      if (!enabled) stopVoices();
      else void unlock();
    },
    setVolume(value) {
      volume = clamp(Number(value) || 0, 0, 1);
      master?.gain.setTargetAtTime(volume, context.currentTime, .04);
      if (volume === 0) stopVoices();
    },
    getState: () => {
      const bank = getBank();
      return { state: available ? (context?.state || 'locked') : 'unavailable', enabled, volume, activeVoices: voices.size,
        sampleSet: activeSet, sampleUrl: bank?.layers[0]?.url, sampleUrls: bank?.layers.map(layer => layer.url) || [],
        sampleState: bank?.state || 'unused', duration: bank?.buffer?.duration || (bank?.layers.length ? 0 : 6.6),
        remaining: Math.max(0, ...Array.from(voices, voice => voice.end - context.currentTime)) };
    },
    dispose() {
      if (disposed) return;
      disposed = true; controller.abort();
      eventTarget.removeEventListener?.('pointerdown', onGesture, true);
      eventTarget.removeEventListener?.('keydown', onGesture, true);
      eventTarget.document?.removeEventListener('visibilitychange', onVisibility);
      stopVoices(); master?.disconnect(); compressor?.disconnect();
      if (context && context.state !== 'closed') void context.close().catch(() => {});
      noise = null; banks.clear();
    },
  };
}
