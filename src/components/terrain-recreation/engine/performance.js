export const PERFORMANCE_PRESET = Object.freeze({ maxPixelRatio: 1, reflectionScale: .38, reflectionFps: 24,
  reflectDragons: false, breathSteps: 16, adaptiveQuality: true });

export function createPerformanceController({ deviceRatio = 1, onScale = () => {}, onReport = () => {} } = {}) {
  let ratio = 1, maximum = 1, samples = 0, frameTotal = 0, cpuTotal = 0, elapsed = 0;
  let average = 16.67, cooldown = 4, stable = 0, warmup = 4, reports = 0, adaptive = null;
  const snapshot = { fps: 0, frameMs: 0, cpuMs: 0, pixelRatio: 1, calls: 0, triangles: 0, target: 60 };
  function configure(settings) {
    const next = Math.min(Math.max(.1,deviceRatio),Math.max(.65,settings.maxPixelRatio??1));
    if (Math.abs(next - maximum) > .001 || adaptive !== settings.adaptiveQuality || reports === 0 && samples === 0) {
      adaptive = settings.adaptiveQuality;
      maximum = next; ratio = next; onScale(ratio); snapshot.pixelRatio = ratio;
      cooldown = 3; stable = 0;
    }
  }
  return { configure, getState: () => ({ ...snapshot }),
    sample(frameMs, cpuMs, settings, render = {}, active = true) {
      if (!active || frameMs > 1000) {
        cooldown = 2; samples = 0; frameTotal = 0; cpuTotal = 0; elapsed = 0; return;
      }
      if (frameMs < 1) return;
      const seconds = frameMs / 1000; warmup = Math.max(0, warmup - seconds); cooldown = Math.max(0, cooldown - seconds);
      average += (frameMs - average) * .06;
      samples++; frameTotal += frameMs; cpuTotal += cpuMs; elapsed += seconds;
      if (settings.adaptiveQuality && warmup === 0 && cooldown === 0) {
        if (average > 19.2 && ratio > .75) {
          ratio = Math.max(.75, Math.round((ratio - .1) * 100) / 100);
          onScale(ratio); cooldown = 3; stable = 0;
        } else if (average < 17.2 && ratio < maximum) {
          stable += seconds;
          if (stable > 8) { ratio = Math.min(maximum, ratio + .05); onScale(ratio); cooldown = 4; stable = 0; }
        } else stable = 0;
      }
      if (elapsed >= 1) {
        Object.assign(snapshot, { fps: 1000 * samples / frameTotal, frameMs: frameTotal / samples,
          cpuMs: cpuTotal / samples, pixelRatio: ratio, calls: render.calls ?? 0, triangles: render.triangles ?? 0 });
        onReport({ ...snapshot }); reports++; samples = 0; frameTotal = 0; cpuTotal = 0; elapsed = 0;
      }
    },
  };
}

