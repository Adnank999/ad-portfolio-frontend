# Cinematic homepage

`../sections/HomePage.tsx` composes the hero (including reviews), about, process, capabilities, experiment, and contact. The project showcase is no longer mounted on the homepage; the hero CTA and navbar Work link open the complete gallery at `/projects`. Gallery cards navigate to `/projects/<slug>` instead of opening modals, sharing image and text transition names with their detail pages. Individual homepage sections and shared UI helpers live in `cinematic/`; WebGL remains homepage-scoped. The direction uses charcoal and warm white, PP Editorial headings, Inter body/status text, shared crimson accent tokens (`#C21E56` in `src/styles/app.css`), flowing multicolored hero filaments, and organic ink edges. Review content remains explicitly labeled as sample until approved testimonials are supplied.

## Scrolling and motion

`../layout/SmoothScrollProvider.tsx` owns one application-wide Lenis instance with `autoRaf: true`. Touch scrolling stays native, nested scroll areas are allowed, and same-page anchors account for the navbar. `RouteScrollSync` cancels momentum before navigation and synchronizes Lenis after TanStack Router restores the scroll position. The router retains ownership of history restoration. Reduced motion destroys Lenis and restores native scrolling.

Framer Motion drives entrances, parallax, image scaling, magnetic links, card tilt, particle time and interaction, and scroll progress. `hooks/useCinematicMotion.ts` contains reusable motion hooks. Section progress is derived into a plain Motion value so browser-accelerated DOM timelines and shader updates cannot diverge. Shader progress stays unsprung; pointer and dispersion interactions use springs.

The process occupies 500 viewport heights and uses a sticky viewport with five interpolated steps. Step buttons provide direct navigation. The desktop project track uses a measured horizontal transform inside a sticky section; arrow controls and focused project links synchronize the vertical scroll. At widths up to 900px, projects become a normal grid, then a single column on phones.

## WebGL

`CinematicCanvas.tsx` is lazy loaded after page load, two paint frames and browser idle time, and exists only inside the homepage. Three.js colors and uniforms are initialized inside that deferred module, so the semantic homepage does not import Three.js eagerly. The headline is visible in server HTML and settles into position without starting at zero opacity. Save-Data/2G connections and reduced-motion preferences retain lightweight fallbacks. The lower particle cloud is allocated only when its section is first visible. Loader GLB warmup waits until four seconds after page load before requesting idle time, so it does not compete with initial content.

One canvas persists through scrolling and ambient pause/resume. Its full-screen shader uses five-octave FBM, domain warping, smoothstep thresholding, and small dispersed droplets to dissolve charcoal into white and white back into charcoal. Both transitions reverse exactly with scroll position. Shader uniforms update through material refs and Motion value subscriptions; content remains semantic DOM above the canvas. Fiber's deprecated internal Clock allocation is replaced by the version-pinned Timer compatibility patch in `patches/`; use `bun install` to preserve it.

The same canvas renders the supplied KTX2 texture/mask pipeline and an interactive particle sphere. All active hero renderer files, GLSL passes, assets, local decoder, and control values live in `shaders-glsl/`. `HeroShader.tsx` preserves the supplied marble/masks, gradient/noise, composite calculations, captured starting time, and timing rates. Its radial feedback pass feeds two horizontal/vertical Gaussian blur iterations. The shader controls panel is hidden; default speed, hover reveal, and dim factor are 1.5, 2, and .25. Control values update uniforms through Motion values. Retired source demos, sculpture shaders, and disconnected homepage components are removed.

Short viewports keep the unpinned, readable layout without disabling the hero and value shaders. Compact rendering uses DPR 1, a 30 FPS demand loop, 384 × 256 hero feedback targets, one blur iteration, and fewer particles. Rendering pauses offscreen and in hidden tabs. The compact particle burst follows its own visual container through the viewport, so stacked mobile copy does not finish the burst before the particles appear. Static layouts omit the fullscreen ink transitions and retain solid content surfaces. Reduced-motion and unavailable-WebGL states retain lightweight artwork without starting the canvas.

The hero clips to its section while scrolling and pauses offscreen, in hidden tabs, and through the ambient-motion control. Its KTX2 assets and Basis transcoder are served locally through Vite URLs. Transcoder workers are released after loading; textures, four offscreen targets, and their materials/geometries are disposed on unmount. Viewport uniforms follow canvas size/DPR, desktop feedback targets match the study at 1536 × 1024, and compact/performance fallback uses 768 × 512. Renderer target and clear-color state are restored after offscreen passes. Failed texture loading retains a static fallback. The particle button disperses/reassembles the points and works by keyboard and touch.

Rendering is continuous only while the hero or experiment is visible and ambient motion is enabled. Other sections render on demand. Hidden tabs pause continuous rendering. DPR is capped at 1.5, compact devices use DPR 1 and 850 points instead of 2400, and Drei's PerformanceMonitor can lower detail. Shader work short-circuits at completed transition endpoints. Fiber disposes declarative materials, geometries, and the renderer on unmount; observers, subscriptions, and context-loss listeners have cleanup functions.

## Fallbacks and content

- Reduced motion, viewports below 600px high, and small phones below 780px high use static layouts with every process step readable.
- WebGL unavailability, context loss, and rendering errors use static backgrounds and decorative alternatives. Normal loading reserves the final section heights to avoid sticky-layout shifts.
- Without JavaScript, a scoped noscript stylesheet presents the sections and project links in normal document flow.
- Existing project photographs are editorial previews. Failed images retain designed card backgrounds, readable project titles, and functional case study links.
- Contact links to the existing `/contact` route; no new contact credentials are invented.

Homepage styles are scoped to `.cinema-home`. Other route designs and existing project data remain intact. The root provider and router scroll behavior are the shared changes. No GSAP or ScrollTrigger is used.

## Validation

Run `bun run test` for TypeScript and `bun run build` for client/server production builds. This repository has no lint or formatter script configured. The existing project detail route has six `loaderData` possibly undefined TypeScript errors, previously documented before this redesign; the new homepage and provider have no reported type errors.

Browser verification covers shader progress, upward scrolling, one persistent canvas, ambient pause/resume, particle interaction, route unmount, history restoration, reduced motion, WebGL fallback, no-JavaScript rendering, keyboard project visibility, and narrow/landscape layouts. Physical-device GPU performance and Safari/Firefox are not verified.
