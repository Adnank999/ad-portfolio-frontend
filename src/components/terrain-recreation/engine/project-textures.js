// A scene-owned cache: overview thumbnails load first; full hero images load on demand.
export function createProjectTextureCache({ loader, fallback, configure, timeoutMs = 6000 }) {
  const requests = new Map(), textures = new Map(), pending = new Set();
  let disposed = false;
  return {
    peek: url => textures.get(url),
    load(url) {
      if (disposed || !url) return Promise.resolve(fallback);
      if (requests.has(url)) return requests.get(url);
      const request = new Promise(resolve => {
        let finished = false;
        const finish = texture => {
          if (finished) { if (texture !== fallback) texture.dispose(); return; }
          finished = true; clearTimeout(timer); pending.delete(cancel);
          if (disposed) { if (texture !== fallback) texture.dispose(); resolve(fallback); return; }
          if (texture !== fallback) { configure(texture); textures.set(url, texture); }
          resolve(texture);
        };
        const cancel = () => finish(fallback);
        const timer = setTimeout(cancel, timeoutMs);
        pending.add(cancel);
        try { loader.load(url, finish, undefined, cancel); } catch { cancel(); }
      });
      requests.set(url, request);
      // A failed request must be retryable after the network/CDN configuration recovers.
      void request.then(texture => { if (texture === fallback && requests.get(url) === request) requests.delete(url); });
      return request;
    },
    dispose() {
      disposed = true;
      for (const cancel of [...pending]) cancel();
      for (const texture of new Set(textures.values())) texture.dispose();
      requests.clear(); textures.clear();
    },
  };
}
