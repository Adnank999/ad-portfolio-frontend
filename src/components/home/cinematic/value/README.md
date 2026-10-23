# Code with purpose

`../CinematicExperiment.tsx` keeps the text on the left and particle core on the right, with three editorial value pillars: useful code, connected systems, and practical AI integration with human review. Mobile places the text before the visual. It deliberately differs from the preceding capability accordion while sharing its typography and accent treatment.

The animated core reuses the homepage's persistent WebGL canvas. `ValueParticles.tsx` adds one point-cloud draw call, no additional canvas, bloom composer, or texture downloads. Core points, floating sparks and a few broad aura sprites share a material, using the About particle core/halo approach. Colors use the same ordered `createParticleHues` values and 92%-saturated full-spectrum rainbow formula as the About page. The SVG fallback uses the matching color calculation.

`particle-data.ts` owns deterministic geometry, rainbow colors and DOM-to-world placement. Scroll measurements are passive and coalesced into one animation frame; resize observers update placement. The mesh follows its actual right-hand container on desktop and its stacked position on mobile, rather than a fixed viewport offset.

Scrolling drives a real radial burst, not a small overall mesh resize. Section progress from 0.3 to 0.7 maps to a smooth 0–1 burst uniform. Core particles launch from a tight radius of 0.07–0.17 into a radius of 0.60–1.95, with per-seed delays and travel distances. Glow sprites follow their core anchors; ambient floating sparks remain independent. Scrolling upward deterministically reverses the radial travel and gathers the cloud into its center. Sprite sizes and the mesh's layout scale remain stable. Elapsed time only controls gentle drift and twinkling, not burst progress.

Frame updates write to `material.current.uniforms`, not the memoized initialization object: R3F can copy the supplied uniforms when constructing the material. This is essential for scroll, time, pointer, and manual-burst changes to reach the actual GPU shader.

The existing homepage visibility/document controls stop continuous rendering offscreen or while hidden. Particle counts drop on compact or low-performance devices. The visual's SVG fallback stays visible until its WebGL counterpart draws and returns on renderer cleanup. Reduced-motion, short-screen, SSR and unavailable-WebGL layouts use that static colored fallback. Pointer and burst interaction are paused in those layouts.
