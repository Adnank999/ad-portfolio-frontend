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

The hero stays charcoal while textures load and feedback targets initialize. Readiness is reported after the first completed canvas render, then the composite and inspector fade in over the shared service-shader fade duration (450 ms). Each rebuilt pipeline's first frame increments a counter so an entering hero reliably starts its fade. A quality adjustment preserves current opacity and readiness, replacing only the feedback targets; it never reinstates an opaque fallback over a visible shader. Animation time starts after initialization. WebGL or asset-loading failure retains the plain background.

The renderer stays inside the one homepage canvas. Fiber advances a shared Motion-value clock only while an effect is visible and running; scroll progress and control values also use Motion values. Below 20% hero visibility, feedback/blur work and pointer listeners stop while opacity fades out; after 500 ms GPU texture storage and all four targets are released, and the meshes are hidden. Decoded pixels and compiled programs stay available for this homepage visit, so returning does not reload, transcode or recompile the effect. The next visible frame recreates the targets and uploads the retained pixels before fading in. Rapid scroll reversal cancels release. Hidden tabs release GPU textures and targets immediately. Leaving the route also disposes the remaining programs, geometries and source data. Transcoder workers are released after loading or cancellation.

The study documents its mouse-feedback pass as reconstructed; this integration preserves that supplied pass rather than claiming it is the recovered original website implementation.
