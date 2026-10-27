# Glowing SVG loader

Adapts the provided glowing-svg-logo-loader.html artwork and video reference: an open angular A without a middle crossbar, layered crimson bloom, stroke tracing, running highlights, sparks and counter-rotating light rings. The demo page's headings, controls and color picker are not part of a pending state. The crossbar is absent from the sharp mark, blurred glow and running highlight alike.

Inline SVG is present in server HTML and needs no external image requests, canvas, WebGL, model decoding, JavaScript animation loop or preload. Each instance uses unique SVG definition IDs, including during SSR hydration. Animation starts partway through the trace so the mark is visible immediately. Reduced motion keeps a static, complete emblem; forced colors use system colors.

The logo's monochrome SVG noise is clipped to its own strokes. The loading scene uses a static, inline 160px noise tile with a low-opacity, pointer-transparent overlay; error views and other page backgrounds are unchanged. Neither grain layer has an animation loop or external texture download, and forced colors disable decorative grain.

All pending views continue to use PageLoading with its live loading message. The 3D loader, asset caches, poster capture, idle warmup, model-version define, Vite model watcher and model asset are removed. Three.js and React Three Fiber remain for other portfolio experiences. Edit LoadingLogo.tsx and loading-logo.css to change this artwork.
