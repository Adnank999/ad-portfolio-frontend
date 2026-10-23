import {
  ACESFilmicToneMapping,
  DirectionalLight,
  MathUtils,
  Mesh,
  MirroredRepeatWrapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
  type BufferGeometry,
  type WebGLRenderTarget,
} from "three";
import { createExplorationLogo, type ExplorationLogoKind } from "./geometry";
import { createLogoSurface, logoSurfaceSettings } from "./material";
import { createLogoReflections } from "./environment";
import colorTextureUrl from "../../home/shaders-glsl/assets/colorA.jpg";

export type LogoRenderer = {
  setActive: (active: boolean) => void;
  dispose: () => void;
};

export function createLogoRenderer(
  canvas: HTMLCanvasElement,
  root: HTMLDivElement,
): LogoRenderer | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    root.dataset.logoState = "fallback";
    return null;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.autoClear = false;
  renderer.setClearColor(0, 0);

  let disposed = false;
  let lost = false;
  let failed = false;
  let textureReady = false;
  let fullPaint = true;
  let reflections: WebGLRenderTarget | null = null;
  const colorTexture = new TextureLoader().load(
    colorTextureUrl,
    () => {
      if (disposed) return;
      textureReady = true;
      fullPaint = true;
      if (lost) return;
      try {
        refreshReflections();
        wake();
      } catch {
        failed = true;
        root.dataset.logoState = "fallback";
      }
    },
    undefined,
    () => {
      if (disposed) return;
      failed = true;
      root.dataset.logoState = "fallback";
    },
  );
  colorTexture.colorSpace = SRGBColorSpace;
  colorTexture.wrapS = colorTexture.wrapT = MirroredRepeatWrapping;
  colorTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const cleanupListeners: (() => void)[] = [];
  const items = Array.from(
    root.querySelectorAll<HTMLElement>("[data-exploration-logo]"),
  ).map((element, index) => {
    const kind = element.dataset.explorationLogo as ExplorationLogoKind;
    const { material, uniforms } = createLogoSurface(colorTexture, index);
    const scene = new Scene();
    const key = new DirectionalLight(0xff476a, 0.25);
    key.position.set(-3, 4, 5);
    const fill = new DirectionalLight(0x9a39ff, 0.08);
    fill.position.set(3, -1, 3);
    scene.add(key, fill);
    const logo = createExplorationLogo(kind, material);
    scene.add(logo);
    const camera = new PerspectiveCamera(30, 1, 0.1, 30);
    camera.position.z = 7;
    const item = {
      element,
      kind,
      scene,
      camera,
      logo,
      material,
      uniforms,
      hover: 0,
      hoverMix: 0,
      pointerX: 0,
      pointerY: 0,
    };
    const card = element.closest("article") ?? element;
    const enter = () => {
      item.hover = 1;
      wake();
    };
    const move = (event: Event) => {
      const pointer = event as PointerEvent;
      if (pointer.pointerType === "touch") return;
      const bounds = card.getBoundingClientRect();
      item.pointerX = MathUtils.clamp(
        (pointer.clientX - bounds.left) / bounds.width - 0.5,
        -0.5,
        0.5,
      );
      item.pointerY = MathUtils.clamp(
        (pointer.clientY - bounds.top) / bounds.height - 0.5,
        -0.5,
        0.5,
      );
    };
    const leave = () => {
      item.hover = 0;
      item.pointerX = 0;
      item.pointerY = 0;
    };
    const blur = (event: Event) => {
      if (!card.contains((event as FocusEvent).relatedTarget as Node | null))
        leave();
    };
    for (const [name, listener] of [
      ["pointerenter", enter],
      ["pointermove", move],
      ["pointerleave", leave],
      ["focusin", enter],
      ["focusout", blur],
    ] as const) {
      card.addEventListener(name, listener, { passive: true });
      cleanupListeners.push(() => card.removeEventListener(name, listener));
    }
    return item;
  });

  let active = false;
  let frame = 0;
  let time = 2.4;
  let previous = 0;
  let width = 0;
  let height = 0;
  let frames = 0;
  root.dataset.logoState = "loading";
  root.dataset.logoActivity = "still";

  function paint(force = false) {
    if (disposed || lost || failed || !textureReady || !reflections) return 0;
    const bounds = root.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return 0;
    const targets = items
      .map((item) => ({ item, target: item.element.getBoundingClientRect() }))
      .filter(
        ({ target }) =>
          target.width > 0 &&
          target.height > 0 &&
          (force ||
            (target.bottom > 0 &&
              target.top < window.innerHeight &&
              target.right > 0 &&
              target.left < window.innerWidth)),
      );
    if (!targets.length) return 0;
    if (width !== bounds.width || height !== bounds.height) {
      width = bounds.width;
      height = bounds.height;
      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio || 1,
          window.innerWidth < 800 ? 1.2 : 1.5,
        ),
      );
      renderer.setSize(width, height, false);
    }
    renderer.setScissorTest(false);
    renderer.clear(true, true, true);
    renderer.setScissorTest(true);
    let rendered = 0;
    for (const { item, target } of targets) {
      const index = items.indexOf(item);
      const aspect = target.width / target.height;
      const viewHeight = Math.max(3.55, 3.25 / aspect);
      item.camera.aspect = aspect;
      item.camera.fov = MathUtils.radToDeg(2 * Math.atan(viewHeight / 14));
      item.camera.updateProjectionMatrix();
      if (active || frames === 0) {
        const phase = time * 0.32 + index * 1.8;
        item.logo.rotation.set(
          Math.sin(phase * 0.8) * 0.15 +
            (item.kind === "modeling" ? 0.38 : -0.08) +
            item.pointerY * 0.16,
          Math.sin(phase) * 0.12 +
            (time - 2.4) * 0.24 +
            (item.kind === "modeling" ? 0.5 : -0.2) +
            item.pointerX * 0.38,
          Math.sin(phase * 0.6) * 0.06 +
            (item.kind === "systems" ? -0.15 : 0.06),
        );
        item.logo.position.y = Math.sin(phase * 1.3) * 0.055;
        item.hoverMix = MathUtils.lerp(item.hoverMix, item.hover, 0.065);
        item.uniforms.uLogoTime.value = time;
        item.material.roughness = MathUtils.lerp(
          logoSurfaceSettings.roughness,
          0.16,
          item.hoverMix,
        );
        item.material.envMapIntensity =
          logoSurfaceSettings.envMapIntensity + item.hoverMix * 0.025;
        item.scene.environmentRotation.set(
          0.12 + Math.sin(time * 0.16 + index) * 0.22,
          time * 0.12 + index * 0.8,
          -0.08,
        );
      }
      const left = target.left - bounds.left;
      const bottom = height - (target.bottom - bounds.top);
      renderer.setViewport(left, bottom, target.width, target.height);
      renderer.setScissor(left, bottom, target.width, target.height);
      renderer.render(item.scene, item.camera);
      rendered++;
    }
    renderer.setScissorTest(false);
    root.dataset.logoState = "ready";
    root.dataset.logoFrames = String(++frames);
    return rendered;
  }

  function tick(timestamp: number) {
    frame = 0;
    if (disposed || lost || failed || document.hidden) return;
    const interval = 1000 / (window.innerWidth < 800 ? 30 : 60);
    if (active && previous && timestamp - previous < interval - 1) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const elapsed = previous
      ? Math.min((timestamp - previous) / 1000, 0.05)
      : 0;
    previous = timestamp;
    if (active) time += elapsed;
    try {
      const visible = paint(fullPaint || !active);
      if (visible) fullPaint = false;
      if (active && visible) frame = requestAnimationFrame(tick);
    } catch {
      failed = true;
      root.dataset.logoState = "fallback";
    }
  }

  function wake() {
    if (!disposed && !lost && !failed && !document.hidden && !frame) {
      previous = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  function refreshReflections() {
    const next = createLogoReflections(renderer, colorTexture);
    const previousReflections = reflections;
    reflections = next;
    items.forEach((item) => {
      item.scene.environment = next.texture;
    });
    previousReflections?.dispose();
    fullPaint = true;
  }

  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    root.dataset.logoState = "fallback";
  };
  const contextRestored = () => {
    lost = false;
    if (textureReady) {
      try {
        refreshReflections();
      } catch {
        failed = true;
        root.dataset.logoState = "fallback";
      }
    }
    wake();
  };
  const scroll = () => {
    if (active) wake();
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("webglcontextrestored", contextRestored);
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("resize", wake, { passive: true });
  const resizeObserver = new ResizeObserver(wake);
  resizeObserver.observe(root);
  items.forEach((item) => resizeObserver.observe(item.element));

  return {
    setActive(next) {
      active = next;
      root.dataset.logoActivity = next ? "playing" : "still";
      if (!next) {
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
      }
      wake();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", wake);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      cleanupListeners.forEach((cleanup) => cleanup());
      const geometries = new Set<BufferGeometry>();
      for (const item of items) {
        item.scene.traverse((object) => {
          if (object instanceof Mesh) geometries.add(object.geometry);
        });
        item.material.dispose();
        item.scene.clear();
      }
      geometries.forEach((geometry) => geometry.dispose());
      reflections?.dispose();
      colorTexture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      delete root.dataset.logoState;
      delete root.dataset.logoFrames;
      delete root.dataset.logoActivity;
    },
  };
}
