# Homepage hero shader

This folder contains every local file used by the homepage hero WebGL renderer. The implementation preserves the supplied KTX2 study's textures, shader calculations, default values, animation rates, and inspector controls. Retired source demos and unused homepage renderers have been removed.

- `HeroShader.tsx`: React Three Fiber integration, texture loading, pointer events, feedback targets, Framer Motion clock, and cleanup.
- `hero.css`: black loading and fallback background, imported by the homepage so reduced-motion/no-WebGL views also receive it.
- `ShaderControls.tsx`: Motion values for speed, hover intensity, and brightness, plus a disclosure panel that is currently not mounted on the homepage.
- `inspect.frag.glsl`: texture/channel inspector for marble, masks, gradient, noise, loop, and blurred loop views.
- `fullscreen.vert.glsl`: supplied fullscreen vertex shader.
- `marble.frag.glsl`: supplied mask-driven marble composite, including its HSL blend, reveal/hide masks, brightness boost, moving gradient, and output conversion. The only integration addition is alpha clipping at the homepage hero boundary; it has no effect at the top of the page.
- `feedback.frag.glsl`: supplied reconstructed 20-sample radial mouse feedback pass, unchanged.
- `blur.frag.glsl`: supplied Gaussian blur, unchanged. Two horizontal/vertical iterations run after each feedback update.
- `assets/`: four original KTX2 marble/mask textures, `colorA.jpg`, `noise.jpg`, `noise2.png`, and the retained study image `noise4.jpg`.
- `basis/`: local JavaScript/WASM transcoder from the installed Three.js package and its upstream README. A LoadingManager maps decoder requests to Vite asset URLs, so no CDN is needed.

The active defaults are animation speed 1.5, hover reveal 2, and dim factor .25. Other shader defaults remain boost 80, reveal boost 30, saturation 3.4886, and radius .24. Time starts at the captured vector `(1.9955107, 3.5206001, 3.5206001)` and advances at `(0.36, 1, 1)` per second. Desktop feedback targets retain the study's 1536 × 1024 size and update every second frame. Compact/performance fallback uses 384 × 256 feedback targets and one horizontal/vertical blur iteration instead of two.

The hero stays black while textures load and feedback targets initialize. Readiness is reported after the first completed canvas render; animation time starts after initialization. WebGL or asset-loading failure retains the black hero background.

The renderer stays inside the one homepage canvas. Framer Motion supplies time, scroll progress, and control values; there is no additional animation loop. Hidden/offscreen/paused scenes stop updating feedback. Resizing updates viewport uniforms, source textures and render targets are disposed on unmount, and transcoder workers are released after loading.

The study documents its mouse-feedback pass as reconstructed; this integration preserves that supplied pass rather than claiming it is the recovered original website implementation.
