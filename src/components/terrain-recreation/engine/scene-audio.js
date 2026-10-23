import { createThunderAudio } from './thunder-audio.js';

const clampVolume = value => Math.min(1, Math.max(0, Number(value) || 0));

export function createSceneAudio({ musicUrl, portalUrl, thunderUrl, thunderSets, hoverUrl, settings, detailMode = false, eventTarget = globalThis,
  createMedia = url => new Audio(url), createContext, loadThunder, now = () => Date.now(),
  fetchMusic = async (url, signal) => {
    const response = await fetch(url, { signal, cache: 'no-store' });
    if (!response.ok || response.status === 204) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    if (blob.size === 0) throw new Error('Empty audio response');
    return blob;
  },
  onError = () => {}, onState = () => {} } = {}) {
  const music = createMedia(), portal = createMedia(portalUrl), hover = hoverUrl ? createMedia(hoverUrl) : null;
  music.loop = true; music.preload = 'none'; portal.preload = 'auto';
  if (hover) { hover.preload = 'auto'; hover.volume = 1; }
  music.volume = portal.volume = 1;
  let context = null, musicGain = null, portalGain = null, musicSource = null, portalSource = null;
  let disposed = false, unlocked = false, restoring = null, currentProject = null;
  let masterEnabled = true, thunderEnabled = Boolean(settings.soundEnabled), mediaBlocked = false, lastStatus = '';
  let musicObjectUrl = null, musicLoaded = false;
  let hoverSource = null, hoverGain = null, lastHover = -Infinity;
  let thunderVolume = clampVolume(settings.thunderVolume);
  let projectThunderVolume = clampVolume(settings.projectThunderVolume ?? .1);
  const updateThunderVolume = () => thunder.setVolume(detailMode ? Math.min(thunderVolume, projectThunderVolume) : thunderVolume);
  let musicEnabled = settings.musicEnabled, portalEnabled = settings.portalSoundEnabled;
  let musicVolume = clampVolume(settings.musicVolume), portalVolume = clampVolume(settings.portalVolume);
  let duckFactor = 1;
  const ducks = new Map();
  const controller = new AbortController();
  function publishState() {
    if (disposed) return;
    const status = !masterEnabled ? 'off' : context?.state === 'running' && !mediaBlocked ? 'on' : 'blocked';
    const signature = `${masterEnabled}:${status}`;
    if (signature === lastStatus) return;
    lastStatus = signature;
    onState({ enabled: masterEnabled, status });
  }
  const musicReady = Promise.resolve().then(() => fetchMusic(musicUrl, controller.signal)).then(blob => {
    if (disposed) return false;
    musicObjectUrl = URL.createObjectURL(blob);
    music.src = musicObjectUrl; music.preload = 'auto'; musicLoaded = true;
    return true;
  }).catch(error => {
    if (!disposed && error?.name !== 'AbortError') onError(`Background music: ${error.message}`);
    return false;
  });

  function updateMix() {
    if (disposed) return;
    clearTimeout(restoring);
    const time = now();
    for (const [key, duck] of ducks) if (duck.until <= time) ducks.delete(key);
    duckFactor = Math.min(1, ...Array.from(ducks.values(), duck => duck.factor));
    if (context) {
      musicGain.gain.cancelScheduledValues(context.currentTime);
      musicGain.gain.setTargetAtTime(masterEnabled && musicEnabled && !detailMode ? musicVolume * duckFactor : 0, context.currentTime, .22);
      portalGain.gain.setTargetAtTime(masterEnabled && portalEnabled && !detailMode ? portalVolume : 0, context.currentTime, .04);
      if (hoverGain) hoverGain.gain.setTargetAtTime(masterEnabled && detailMode && portalEnabled ? .09 * portalVolume / .18 : 0, context.currentTime, .025);
    }
    if (ducks.size) restoring = setTimeout(updateMix, Math.max(10, Math.min(...Array.from(ducks.values(), duck => duck.until)) - time + 5));
  }

  const thunder = createThunderAudio({ enabled: settings.soundEnabled, volume: settings.thunderVolume,
    eventTarget, autoUnlock: false, sampleUrl: thunderUrl, sampleSets: thunderSets, sampleSet: detailMode ? 'details' : 'showcase', onError,
    ...(loadThunder ? { loadSample: loadThunder } : {}), ...(createContext ? { createContext } : {}),
    onContext: audio => {
      context = audio.context;
      context.addEventListener?.('statechange', publishState);
      musicSource = context.createMediaElementSource(music);
      portalSource = context.createMediaElementSource(portal);
      musicGain = context.createGain(); portalGain = context.createGain();
      musicGain.gain.value = musicEnabled && !detailMode ? musicVolume : 0;
      portalGain.gain.value = portalEnabled && !detailMode ? portalVolume : 0;
      musicSource.connect(musicGain); musicGain.connect(audio.destination);
      portalSource.connect(portalGain); portalGain.connect(audio.destination);
      if (hover) {
        hoverSource = context.createMediaElementSource(hover); hoverGain = context.createGain();
        hoverGain.gain.value = detailMode && portalEnabled ? .09 * portalVolume / .18 : 0;
        hoverSource.connect(hoverGain); hoverGain.connect(audio.destination);
      }
    },
  });
  updateThunderVolume();

  function playMedia(media, label) {
    try {
      return Promise.resolve(media.play()).then(() => {
        if (disposed || !masterEnabled || eventTarget.document?.hidden || (detailMode && media !== hover) || (!detailMode && media === hover) || (media === music && (!musicEnabled || musicVolume <= 0)) || (media !== music && (!portalEnabled || portalVolume <= 0))) { media.pause(); return false; }
        if (media === music) mediaBlocked = false;
        publishState();
        return true;
      }).catch(error => {
        if (media === music && error?.name === 'NotAllowedError') { mediaBlocked = true; publishState(); }
        if (!disposed && error?.name !== 'AbortError' && error?.name !== 'NotAllowedError') onError(`${label}: ${error.message}`);
        return false;
      });
    } catch (error) {
      if (!disposed) onError(`${label}: ${error.message}`);
      return Promise.resolve(false);
    }
  }

  function unlock() {
    if (disposed || !masterEnabled || eventTarget.document?.hidden) return Promise.resolve(false);
    const ready = thunder.unlock({ force: musicEnabled || portalEnabled });
    if (context) unlocked = true;
    if (context && !detailMode && musicEnabled && musicVolume > 0 && music.paused) {
      if (musicLoaded) void playMedia(music, 'Background music');
      else void musicReady.then(loaded => {
        if (loaded && !disposed && masterEnabled && !detailMode && musicEnabled && musicVolume > 0 && !eventTarget.document?.hidden && music.paused) void playMedia(music, 'Background music');
      });
    }
    publishState();
    return ready.then(result => { publishState(); return result; });
  }

  function stopPortal() {
    currentProject = null;
    portal.pause(); portal.currentTime = 0;
    ducks.delete('portal'); updateMix();
  }

  function playPortal(project) {
    if (disposed || !masterEnabled || detailMode || !portalEnabled || portalVolume <= 0 || eventTarget.document?.hidden || currentProject === project) return Promise.resolve(false);
    void unlock();
    if (!context) return Promise.resolve(false);
    currentProject = project;
    portal.pause(); portal.currentTime = 0;
    const duration = Number.isFinite(portal.duration) ? Math.min(10, portal.duration) * 1000 : 3300;
    ducks.set('portal', { factor: .55, until: now() + duration }); updateMix();
    return playMedia(portal, 'Portal sound');
  }

  const onGesture = event => { if (!event.target?.closest?.('[data-sound-toggle]')) void unlock(); };
  const onVisibility = () => {
    if (eventTarget.document?.hidden) {
      music.pause(); hover?.pause(); stopPortal(); ducks.clear(); updateMix();
    } else if (unlocked) void unlock();
  };
  const onMusicError = () => onError('Background music could not load. Check public/audio/kaer-morhen.mp3.');
  const onPortalError = () => onError('Portal sound could not load. Check public/audio/portal-jump.mp3.');
  const onHoverError = () => onError('Image hover sound could not load. Check public/audio/air_slash_02.mp3.');
  music.addEventListener('error', onMusicError); portal.addEventListener('error', onPortalError);
  hover?.addEventListener('error', onHoverError);
  eventTarget.addEventListener?.('pointerdown', onGesture, true);
  eventTarget.addEventListener?.('keydown', onGesture, true);
  eventTarget.document?.addEventListener('visibilitychange', onVisibility);
  publishState();

  return {
    unlock, playPortal, stopPortal, whenReady: () => Promise.all([musicReady, thunder.whenReady()]).then(results => results.every(Boolean)),
    setEnabled(value) {
      if (disposed) return Promise.resolve(false);
      masterEnabled = Boolean(value);
      music.muted = portal.muted = !masterEnabled;
      if (hover) hover.muted = !masterEnabled;
      thunder.setEnabled(masterEnabled && thunderEnabled);
      if (!masterEnabled) { music.pause(); hover?.pause(); stopPortal(); ducks.clear(); }
      updateMix(); publishState();
      return masterEnabled ? unlock() : Promise.resolve(false);
    },
    setDetailMode(value) {
      if (disposed || detailMode === Boolean(value)) return;
      detailMode = Boolean(value);
      thunder.setSampleSet(detailMode ? 'details' : 'showcase');
      if (detailMode) { music.pause(); stopPortal(); mediaBlocked = false; }
      else { hover?.pause(); lastHover = -Infinity; }
      updateThunderVolume();
      updateMix();
      publishState();
      if (!detailMode && unlocked) void unlock();
    },
    playHover() {
      if (disposed || !masterEnabled || !detailMode || !hover || !unlocked || context?.state !== 'running' ||
        !portalEnabled || portalVolume <= 0 || eventTarget.document?.hidden || now() - lastHover < 450) return Promise.resolve(false);
      lastHover = now(); hover.pause(); hover.currentTime = 0;
      return playMedia(hover, 'Image hover sound');
    },
    async strike(event) {
      const played = await thunder.strike(event);
      if (played && !disposed && masterEnabled) { ducks.set('thunder', { factor: .35, until: now() + thunder.getState().remaining * 1000 }); updateMix(); }
      return played;
    },
    setSetting(key, value) {
      if (!['soundEnabled','thunderVolume','projectThunderVolume','musicEnabled','musicVolume','portalSoundEnabled','portalVolume'].includes(key)) return false;
      if (key === 'soundEnabled') { thunderEnabled = Boolean(value); thunder.setEnabled(masterEnabled && thunderEnabled); if (!value) ducks.delete('thunder'); }
      if (key === 'thunderVolume') { thunderVolume = clampVolume(value); updateThunderVolume(); if (thunderVolume <= 0) ducks.delete('thunder'); }
      if (key === 'projectThunderVolume') { projectThunderVolume = clampVolume(value); updateThunderVolume(); }
      if (key === 'musicEnabled') {
        musicEnabled = Boolean(value);
        if (!musicEnabled) music.pause(); else void unlock();
      }
      if (key === 'portalSoundEnabled') { portalEnabled = Boolean(value); if (!portalEnabled) { stopPortal(); hover?.pause(); } }
      if (key === 'musicVolume') { musicVolume = clampVolume(value); if (musicVolume === 0) music.pause(); else if (unlocked) void unlock(); }
      if (key === 'portalVolume') { portalVolume = clampVolume(value); if (portalVolume === 0) { stopPortal(); hover?.pause(); } }
      updateMix();
      return true;
    },
    getState: () => ({ ...thunder.getState(), masterEnabled, status: !masterEnabled ? 'off' : context?.state === 'running' && !mediaBlocked ? 'on' : 'blocked', unlocked, duckFactor, detailMode,
      music: { enabled: musicEnabled, volume: musicVolume, playing: !music.paused, time: music.currentTime, ready: musicLoaded },
      portal: { enabled: portalEnabled, volume: portalVolume, playing: !portal.paused, project: currentProject },
      hover: { enabled: portalEnabled, volume: .09 * portalVolume / .18, playing: hover ? !hover.paused : false } }),
    dispose() {
      if (disposed) return;
      disposed = true; clearTimeout(restoring); controller.abort();
      context?.removeEventListener?.('statechange', publishState);
      eventTarget.removeEventListener?.('pointerdown', onGesture, true);
      eventTarget.removeEventListener?.('keydown', onGesture, true);
      eventTarget.document?.removeEventListener('visibilitychange', onVisibility);
      music.removeEventListener('error', onMusicError); portal.removeEventListener('error', onPortalError);
      hover?.removeEventListener('error', onHoverError);
      music.pause(); portal.pause();
      music.removeAttribute('src'); portal.removeAttribute('src'); music.load(); portal.load();
      if (hover) { hover.pause(); hover.removeAttribute('src'); hover.load(); }
      if (musicObjectUrl) URL.revokeObjectURL(musicObjectUrl);
      musicSource?.disconnect(); portalSource?.disconnect(); musicGain?.disconnect(); portalGain?.disconnect();
      hoverSource?.disconnect(); hoverGain?.disconnect();
      thunder.dispose();
    },
  };
}
