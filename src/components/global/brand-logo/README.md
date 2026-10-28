# Brand logo

The navbar embeds the original logo path directly in server HTML, colored with the shared accent token. It needs no image request, JavaScript, canvas or OGL to remain visible. The base SVG is never hidden or replaced by the canvas, so loading, blank frames, resize, cleanup and WebGL failures cannot leave an empty logo.

Pointer hover or keyboard focus requests a separate transparent electric overlay after page load, two paints and idle time. The effect fades in after its first real frame; the accent SVG stays underneath throughout. Idle navigation does not create a second WebGL context alongside the hero. Leaving the mark releases the overlay renderer. Reduced-motion and Save-Data/2G users keep the accent SVG.

The navbar effect traces a cached 128 px mask, draws at most 30 FPS at DPR 1, and skips the old 1.4-second draw-in so the static/electric handoff stays legible. The general ElectricLogo component retains configurable defaults for other sizes.
