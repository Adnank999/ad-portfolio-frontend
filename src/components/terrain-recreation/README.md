# Terrain project experience

## Published project data

### Thumbnail and featured image

Admin Projects require a **Terrain thumbnail URL**. Paste a public HTTP(S) or root-relative image URL, or use its upload button (the existing verified project-gallery upload flow). It is saved as `fields.thumbnailUrl` and used for terrain overview portals and project cards. Thumbnail URLs on the managed R2 domain still require a verified asset reference; uploading through the field registers this automatically.

Select **Use project cover as featured image**, or a gallery image's **Use as featured image** checkbox. Only one image is selected, independently of the existing *Featured project* flag. Selection is saved as `fields.featuredImageUrl`, which must match the project cover or a gallery URL. Reordering retains the selection; removing a selected gallery image returns to the cover. The featured image and its saved alt text appear at the top of the details and in default project social metadata.

The overview loads thumbnail textures only. Opening details loads the full featured texture on demand in a scene-owned cache; stale navigation responses cannot replace the current project's artwork. Textures are reused and disposed with the scene. The native fallback uses the same featured image. Existing records without these fields continue to display their cover; editing/saving an older project now requires setting a thumbnail URL.

Deploy frontend and backend together. These properties live in the existing project JSON fields; no SQL migration or image backfill is required. The API rejects unsafe/missing thumbnails and featured URLs outside the project's own cover/gallery. See `Backend/examples/project.json` and the `ProjectWrite` OpenAPI schema for the write contract.

Public project pages now use the Rust API's `/api/v1/projects` archive and `/api/v1/projects/:slug` detail endpoints through TanStack Start server functions. Only database projects that are published, due and not deleted appear. There is no seeded-project fallback when the API is empty, unavailable or returns 404. The existing private `PORTFOLIO_API_URL` must point to the running backend.

The archive is paginated and cached under `public-projects`. Create, update, publication, unpublication and delete mutations invalidate that namespace. Project routes fetch fresh queries on entry; active queries also refresh on window focus. The detail endpoint supplies saved narrative fields, cover alt text, gallery media and SEO. Search and service-related project links use the same public archive. The optional homepage work section uses it when mounted; no new homepage section is introduced.

`toTerrainProjects()` and `createProjectCatalog()` are pure adapters over supplied records. Every scene owns its catalogue and portals; no mutable shared project list or demo beacons are used. Router commits hydrate full project details into the existing scene without rebuilding it on every detail navigation. Changes to the archive rebuild the scene. Empty archives render an explicit empty state without loading Three.js; one-project archives avoid missing-marker shortcuts and hide a self-referencing next-project link. Legacy `src/data/projects.ts` values remain only as editorial seed/fixture data for case studies and tests; public project views do not import them as runtime records.

## Mobile showcase

At widths up to 760px the introduction sits at the bottom, keeping the center clear. The description is omitted on mobile and the heading is smaller. Camera distance scales with the viewport aspect ratio (up to 1.5×), including selected-project framing, without changing desktop camera settings. Mobile-only Previous/Next arrow buttons appear below a selected portal, cycle through every project with wraparound, and disappear in the full project-details view. They reuse the existing portal selection and transition pipeline.

## Volcanic scene port

The experience now uses the latest `terrain-recreation` scene: a low central volcano, a lower crescent mountain chain with unequal peaks, an open lagoon mouth, no connecting rock bridge, and the supplied 1K dark-rock / rocky-terrain PBR maps. `public/terrain/assets/aether` contains only approximately 5.4 MB of runtime GLBs, height data, region mask and compressed textures. Original Blender files, EXRs and intermediate raw buffers are not copied into the frontend.

The shared height grid drives terrain, water masking, dragon clearance/collisions, trees and marker placement. All portfolio projects remain available: their real slugs and content are preserved, while `createPortfolioMarkerOrigins` distributes them along the crescent and checks each beacon footprint instead of importing the prototype's four demo project IDs. Instanced fir LOD2 geometry shares two 512px atlases (approximately 141 KB combined).

The fire dragon circles the volcano and heats its lava bright red; it gradually cools to softer orange after contact. The ice dragon follows a wider river patrol, selects unobstructed water targets and leaves melting frost. Both include turbulent ray-marched cores, pooled embers/crystals and impact bursts. Inactive mist particles are clipped before expensive shading. A bounded smoke plume and local heat-colored light accompany the volcano. The terrain layout and effects are client-only and reuse the existing persistent canvas.

Portfolio-specific TanStack navigation, cancellation on route exit, loading UI, muted/low-volume thunder mixes, project-background frost/defaults, media gallery and existing CSS remain intact. New assets resolve under `/terrain/assets/aether/`, including when a non-root Vite base is used. If generated assets cannot load, the previous terrain remains the fallback; `?terrain=legacy` deliberately selects it for comparison.

Tests in `tests/terrain-volcano.test.ts` verify asset budgets, all portfolio marker positions, fire/ice targets, lava uniforms and frost melting alongside the existing terrain/navigation/gallery tests.

The standalone terrain prototype is integrated directly into TanStack Router, not embedded in an iframe or loaded from the original Windows folder.

## Files

- `TerrainProjectLayout.tsx` owns the persistent project-route layout and native navigation.
- `TerrainExperience.jsx` is the extracted React interface, with its TypeScript props declared in `TerrainExperience.d.ts`.
- `TerrainProjectFallback.tsx` provides a single-line loading message, server-rendered content and an accessible fallback when WebGL2 is unavailable. No asset names or loading stages are displayed.
- `TerrainNavigation.tsx` provides Back navigation and the right-aligned sound toggle.
- `terrain.css` contains the prototype's styles, scoped to this experience. It does not reset the portfolio's body, headings, buttons or scroll behavior.
- `engine/` contains the JavaScript scene, shader, audio, interaction and rendering modules, adapted to this application's routing, assets and portfolio content.
- `public/terrain/` contains the supplied assets, audio tracks, Draco decoder files and attribution notices. Runtime paths are relative to Vite's base URL.

## Run and routes

Run `npm run dev` in `adnan-portfolio-frontend`, then visit `/projects`.

`/projects/:slug` keeps the existing portfolio URLs and SEO metadata. The overview, project detail, next-project and browser-history transitions reuse one canvas and audio controller. Leaving the project routes disposes the renderer, event listeners and audio. The regular portfolio navbar/footer and Lenis are not mounted around the fullscreen terrain routes; other routes are unchanged.

Published project content comes from the public API, with `project-data.ts` adapting those records into terrain beacons. Overview artwork uses the project's thumbnail; the details hero loads its selected featured image on demand. GPU artwork needs CORS-enabled image sources. Hero HTML images and shader textures both request anonymous CORS; a denied texture leaves the ordinary image visible and keeps its pixels out of WebGL. Failed requests can retry on reopening the project. A neutral local terrain texture remains the overview preview fallback. Large images and gallery media render natively in HTML, and no external game artwork is substituted for a portfolio project.

For R2 custom domains, allow `GET`/`HEAD` from the website origin on the public image bucket, and purge cached images after changing that policy. Inspect the final image response with the website's `Origin` header; the response must be successful and include a matching `Access-Control-Allow-Origin`. Bucket CORS alone cannot fix a failing object request or headers stripped by another CDN/redirect. The native fallback preserves the image while an effect cannot load; it does not bypass browser CORS.

## Controls and sound

- Controls stay hidden by default on both terrain and project details, including after navigation. Press **P** to show/hide the panel; project details select **BACKGROUND** when opened. **Hide controls** also closes it.
- Change the initial tuning in `engine/scene.js` (`DEFAULT_SETTINGS`).
- `SHOW_BACKGROUND_BUTTON` in `TerrainExperience.jsx` controls the optional details-only background-panel launcher; it remains `false`.
- Sound is enabled by default and attempts to start while terrain assets prepare. Browsers blocking audible autoplay require the first click/keypress or **Enable sound** in the top-right toggle. This toggle mutes/restores scene audio without resetting the individual volume controls.
- **Back** returns project details to `/projects`, and the terrain overview to `/`. The shell follows committed route matches, preventing the project fallback from appearing while a different page is still loading.
- Project details keep background music paused, with the quieter project thunder level and image-hover cue from the prototype.
- Each lightning strike uses a cached, normalized three-layer thunder mix from `public/terrain/audio/thunder/`. The terrain combines `low-thunder`, `medium-thunder` and `big-thunder`; details combine the three `medium-thunder*-project-details` recordings at the lower page volume. `engine/thunder-mixes.js` controls their relative levels and small onset offsets. Switching views cancels the previous mix's tail and any pending strikes, without creating another audio context.
- Terrain thunder defaults to `thunderVolume: .30`; project details retain the quieter `.10` cap. Every recorded thunder mix fades in over up to 0.3 seconds and fades out over up to 2.2 seconds using the shared gain envelope in `engine/thunder-audio.js`. Short or late-starting clips scale their fades to the remaining playback time. Music, portal levels and lightning timing are unchanged.
- **Escape / TO OVERVIEW** returns to the terrain; **1–6** selects a beacon, **L** triggers lightning and **B** triggers both dragon breaths.

Reduced-motion preferences are retained. A client-only lazy boundary keeps Three.js initialization out of SSR and avoids loading the terrain engine on unrelated pages. The existing installed Three.js dependency is reused; no extra application dependency is required.

## Editorial layout and media gallery

Click an image preview, or focus it and press Enter/Space, to open that original image in the gallery. Closing the gallery returns focus to the selected preview; the right-side gallery button remains available.

The landing header contains Back and a sound toggle, with no lower-left shortcuts, status text or performance labels. The Enter the World action is unchanged. All h1 headings request PP Editorial Bold; h2–h6, spans and navbar labels request PP Editorial Regular through `src/styles/app.css`. Body paragraphs remain Inter. Georgia remains the fallback until the licensed PP Editorial font files are supplied.

Project hero images use 92% viewport width (94% on mobile), up to 84vh, and blend into the persistent canvas with wider erosion/reveal masks. The next-project image uses an expanded circular organic mask and a larger frame. Background tone mapping/color grading now runs before the artwork compositor: images convert their linear texture samples back to source sRGB without the background hue rotation, exposure reduction or former 2× brightness compensation. The background retains its existing grade and atmospheric lighting; final film grain remains shared. The same source-color path applies to hero, next-project and small detail images.

Project backgrounds use the selected sharp retained-scene sampling (`projectBackgroundBlur: 0`) and fine-grained icy shader glints (`projectFrost: .73`, `projectFrostDensity: .52`, `projectFrostSize: .23`). Background glow is `3`, lightning glow `1.59`, bloom `.24` with threshold `.31`, displacement `1.32` with scale `5`, and page exposure `.25`. Page grain remains `.09` and page thunder volume `.10`. Each tiny antialiased sparkle independently lights up to a bright icy peak, then smoothly fades almost completely out. Per-sparkle timing and per-cycle randomized onset, fade durations and peak brightness avoid synchronized or repetitive sine-wave shimmer. A tightly confined halo makes bright points glow without large blobs or star rays. These render before project artwork and HTML content, not over images, videos or text. Change the defaults in `engine/scene.js`, or adjust **BACKGROUND → Background softness / Frost sparkle intensity / Frost sparkle density / Frost sparkle size**. Reduced motion keeps the frost pattern still. No additional canvas or full-screen rendering pass is added.

Additional media defaults to `layout: 'large'`: consistent 16:10 HTML previews in a two-column grid inside the project content width, with a single column on mobile. Screenshots crop from the top without stretching; captions share the same spacing and type scale. The right-side gallery displays original media uncropped. Set an image's `layout: 'small'` to use a 70:30 image/caption layout and an expanded scroll-revealed organic shader mask. Scroll visibility is reversible when moving back out of view; hover gently expands the mask. Small images share the existing renderer and only visible image planes draw. Reduced motion displays the completed reveal without animated displacement. If a small image disallows CORS, its native image uses the enlarged, centered static mask instead. The full-screen gallery always keeps every image/video clean.

The right-side action rail pairs a glowing live-website link (when configured) with the gallery button. The gallery icon is drawn by `engine/gallery-launcher.js` on the existing renderer, not a second canvas; the live icon uses a static CSS glow. Its native button opens `gallery/ProjectGallery.tsx`, an accessible Radix dialog with full-width image/video viewing, keyboard navigation, touch swipe, captions and lazy thumbnails. Only the active video is mounted, and adjacent images preload only while the gallery is open. Terrain rendering and scene audio pause behind the gallery and resume on close. Escape closes the gallery without navigating away from the project.

Published project cover and gallery images are managed in the admin Projects form. Their database `gallery` entries become image `media` records for the 3D view and full-screen gallery. The renderer's optional media contract also supports the following shapes when supplied by another verified data source:

```ts
media: [
  { type: 'image', layout: 'small', src: '/images/your-project-detail.webp', alt: 'Describe the interface', caption: 'The booking flow' },
  { type: 'image', layout: 'large', src: '/images/your-project-screen.webp', alt: 'Full interface screenshot' },
  { type: 'video', src: '/videos/your-project-demo.mp4', alt: 'Project walkthrough', poster: '/images/your-project-poster.webp' },
]
```

These are example paths, not bundled media. The cover image is always included automatically, duplicate URLs are removed, and optional `thumbnail` URLs can provide smaller previews. Existing projects currently have only their supplied cover image until additional media is configured.

## Checks and publishing

Run `bun run test:projects:layout` and `bun run test:projects:layout --mobile` to check consistent screenshot frames, content containment, the live-link rail and the uncropped gallery at desktop and phone widths. Add `--screenshot` to save a local preview under `.deploy/`.

Run `npm run test`, `bun run test:unit`, `bun run test:projects:browser`, `bun run test:projects:cors`, and `npm run build`. The terrain-specific unit tests are in `tests/terrain-projects.test.ts`. The project artwork browser fixture renders the real Three.js output/artwork passes and checks exact source RGB (including neutral gray) under different background exposures, native small-image texture color, widened organic/circular mask coverage, and WebGL errors. The CORS browser fixture uses separate origins to verify approved textures, denied-texture native fallback and retry after recovery. Add `--native-gpu` to the artwork browser test command to exercise the available hardware GPU rather than SwiftShader.

Neutral-image/wider-frame verification: 180 unit tests passed with a 20-second per-test timeout, along with TypeScript and the production build. All 13 artwork browser checks passed with SwiftShader and native NVIDIA WebGL2; source RGB round-trips matched exactly. The expanded organic and circular masks covered approximately 67.6% and 55.8% of the test frame. The live terrain-page smoke check measured the expected desktop widths but remained in its loading/opening state, so full-page visual acceptance was not completed. Separate shader files being added during verification were left untouched.

Review `public/terrain/THIRD_PARTY_NOTICES.txt` and obtain the appropriate rights for all supplied artwork and audio before public deployment. Copying these assets into the portfolio does not establish redistribution rights.
