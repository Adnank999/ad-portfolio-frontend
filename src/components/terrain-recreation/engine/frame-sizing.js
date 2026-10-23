export function createFrameSizing({ renderer, composer, camera, fluid, water, onResize = () => {} }) {
  let pending = null, applied = null;
  return {
    request(size) { pending = { ...size }; },
    apply() {
      if (!pending) return false;
      const width = Math.max(1, Math.floor(Number(pending.width) || 1));
      const height = Math.max(1, Math.floor(Number(pending.height) || 1));
      const displayRatio = Math.max(.1, Number(pending.displayRatio) || 1);
      const renderRatio = Math.min(displayRatio, Math.max(.1, Number(pending.renderRatio) || 1));
      const renderWidth = Math.max(1, Math.floor(width * renderRatio));
      const renderHeight = Math.max(1, Math.floor(height * renderRatio));
      const viewportChanged = !applied || width !== applied.width || height !== applied.height;
      const displayChanged = viewportChanged || displayRatio !== applied.displayRatio;
      const targetChanged = !applied || renderWidth !== applied.renderWidth || renderHeight !== applied.renderHeight;
      pending = null;
      if (displayChanged) renderer.setDrawingBufferSize(width, height, displayRatio);
      if (viewportChanged) {
        camera.aspect = width / height; camera.updateProjectionMatrix();
        fluid.resize(width, height); water.resize(width, height);
      }
      if (targetChanged) composer.setSize(renderWidth, renderHeight);
      applied = { width, height, displayRatio, renderRatio, renderWidth, renderHeight };
      if (displayChanged) onResize();
      return displayChanged || targetChanged;
    },
    getState: () => applied ? { ...applied } : null,
  };
}

