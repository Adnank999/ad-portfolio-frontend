# Service visual shaders

Each service independently configures Hero, Overview, Spotlight and Articles 1–3 at `/admin/services`. Choose Default illustration, Image, Shader, or the backward-compatible Existing image / video editor. Shader controls and previews edit the unsaved service draft; only the form's Save changes button writes to the API. Section images use the existing verified `service_image` WebP/direct-R2 flow, requiring both direct-upload flags and R2 setup. Shaders require no image upload or poster. Existing media remains readable and the legacy editor remains available when direct uploads are disabled.

`fields.visuals` is an optional map from slot to a tagged image/shader configuration. It lives in the existing PostgreSQL `content_items.fields` JSONB column; no new migration or destructive backfill is required. A visual overrides the same slot in the old `fields.media` array; old media is retained for deliberate rollback, never rendered as a second active visual. Restore illustration clears both settings for that slot. Shader `poster` is optional legacy/SEO metadata and is never rendered as a runtime fallback. Existing poster references stay readable; any new image/poster URL still requires a ready, permitted `service_image` asset through the form's `assetIds` contract. Deploy the updated backend before saving poster-free shaders from the updated frontend. No database migration is needed for this optional JSON field.

Hero shaders fill the entire hero behind its heading, summary and contact action, with the existing dark readability overlay. Hero images and videos retain their framed, below-text layout. All six shader slots use the same `#151515` page background in SSR, while loading, offscreen, under reduced motion, and after errors. They never download a fallback image.

## Included effects

- Orb adapts the existing `src/components/Orb.tsx` without moving or overwriting it. Controls match its actual reviewed interface: colors, background, hue, size, glow, bleed, wobble, highlight, trail, tilt, speed, hover behavior, cursor following, click pulse, intro and opacity. Runtime-only DPR is capped at 1.5 and is not saved by admins.
- Gradient Flow is a small first-party WebGL2 renderer with its own colors, speed, amplitude, blend and direction schema. Its animation, resize observer, shaders, program, buffer and context are released on unmount.
- Gradient ASCII is registered as ready with 22 validated admin controls, including palette, shape, character/font presets, cell size, animation and interaction settings. Arbitrary font strings, HTML and runtime-only props are not accepted. Its adapter caps DPR at 1.25; the reviewed renderer uses fresh effect-owned canvases and releases its multipass targets, atlas, programs and listeners on teardown.

Running tests or building does not activate a draft. Prepare and verify its definition/adapter, leave `status: 'draft'`, run `shader:sync` and deploy the matching code/manifests once. Then activate it from **Admin → Shaders** (`/admin/shaders`) in the sidebar, without editing code or opening a service. Existing source-level ready shaders default active for compatibility. The backend embeds its manifest at compile time; newly installed source still needs a rebuild/deployment, but activation changes do not.

## Admin activation

### Newly configured library

The 18 installed effects now have reviewed strict schemas, bounded defaults, matching admin controls and validating adapters: Antigravity, Aurora, Crystalized Ball, Dither Veil, Dither, Flux Lines, Ghost Fibers, Gradient Waves, Grainient, Hyperspeed, Laser Flow, Letter Glitch, Light Pillar, Light Tunnel, Lightfall, Prismatic Burst, Soft Aurora and Web Threads. Both generated manifests contain 21 configured effects, including the original three. The new effects remain configured drafts (`defaultActive: false`): the administrator chooses when to activate each one, rather than a build silently publishing it.

Controls expose the actual installed component interfaces, including palettes, motion, shape/preset choices, bounded detail/counts and interactions where supported. Crystalized Ball presets retain their vendor-specific appearance settings, with independent tint and bounded particle count. Hyperspeed maps the safe saved `roadReflections` field to its vendor `reflections` prop. Runtime DPR, DOM references, callbacks, arbitrary CSS, image sources and font strings are not editable content. Dither Veil uses a fixed, code-owned gradient/ring texture, not its vendor's external sample photograph; this image-reveal effect therefore works without a remote image dependency. Letter Glitch uses a fixed system monospace font.

Adapters validate props before rendering. Raw WebGL effects own fresh canvases per effect setup and detach them before releasing their contexts; OGL/Three effects also release their contexts on navigation. Resolution and heavy particle/thread counts are bounded independently from content. The existing shared runtime still controls visibility, background-only fallbacks, reduced motion and serialized fade transitions.

After updating locally, rebuild/restart the backend and restart the frontend development server if needed, then open **Admin → Shaders → Refresh shader catalog → Activate**. For production, commit the definition/adapter/vendor changes and frontend manifest, commit the identical backend manifest, deploy the backend image first and the frontend second. Refresh the admin catalog, activate the desired effect, choose it for a service slot, edit its controls and Save changes. No new database migration is required for these additional contracts; the existing shader activation migration must already be applied. Do not edit `status` to bypass admin activation.

`bun run test:shaders:installed` tests every configured draft with real WebGL, including Strict Mode replay, nonuniform rendered pixels, live control updates without replacing the canvas, context disposal and absence of remote asset requests. Run with `--native-gpu` for the installed hardware backend. CI runs these checks in addition to the original runtime/fade/fallback browser suite. Unit tests validate all installed control limits, reject executable/runtime props, verify SSR backgrounds and compare both manifest files when both repositories are available in the workspace.

Users with `services:publish` can activate/deactivate configured shader contracts. Availability saves immediately to PostgreSQL, separately from the service's Save changes action; it is keyed by ID, version and contract hash and survives restarts/deployments. Editors with only `services:write` can use the active library but cannot change global availability. Use Refresh shader catalog after another administrator makes changes.

Empty/unconfigured drafts show Needs setup and cannot be activated. A valid strict schema, defaults, controls and fixed adapter must already exist in the deployed build. Activation never uploads source, edits repository files or invokes a package manager. Deactivation blocks new slot assignments on the backend, not just in the picker. Existing assignments remain renderable and editable, including their current props, so live pages do not break. A new slot or replacement needs an active shader.

Apply `Backend/migrations/202610270001_shader_activation.sql` through the normal migration command before running the updated backend. Locally, stop the old API, run `cargo run --locked --bin portfolio-api -- migrate` in Backend, then `cargo run --locked --bin portfolio-api -- serve`. Do not manually replay the SQL if SQLx already applied it. Production CI runs migrations before API activation as usual. Deploy backend first, then frontend, and refresh the admin page. No existing service content or media is backfilled/deleted.

A missing activation table returns HTTP 503 (`shader_schema_unavailable`) with instructions to apply pending migrations. The Shaders page displays the error and Retry shader catalog; it does not enable controls from stale data. Check that the migration command and running API use the same database. The generic HTTP 500 trace alone cannot distinguish an unmigrated schema from another database failure; inspect the preceding backend error without sharing connection credentials.

Only metadata and schemas are imported eagerly. Vite discovers `definitions/*.ts`; implementations are lazy imports through fixed adapters, not paths supplied by content. One shared provider per service page/editor selects the most visible shader with hysteresis. A ready renderer fades in over 450 ms; an outgoing renderer fades out before disposal, then the next renderer mounts. Scroll reversals cancel pending disposal and reuse the existing canvas. At most one WebGL renderer is mounted, including during handoff. Hidden tabs and reduced motion release it immediately without waiting for a fade. Context loss is fail-closed until the shader selection changes or the page reloads. Browser lifecycle checks exercise real software WebGL2, not mocked renderers.

Each renderer effect owns a fresh canvas. Cleanup detaches that canvas before releasing its WebGL context, so React Strict Mode's setup/cleanup/setup cycle cannot reuse a lost context or trigger the slot's genuine-context-loss fallback. The browser fixture runs inside Strict Mode and checks sustained drawing and live prop updates for both renderers.

Gradient Flow errors identify vertex compilation, fragment compilation or program linking, include the driver diagnostic, and distinguish a lost context. Run `bun run test:shaders:browser --native-gpu` to test the browser's native GPU backend instead of the default software renderer. The runner prints the actual renderer; native GPU availability depends on the machine. Both modes test that compiler/linker failures preserve diagnostics, release resources and retain the plain background.

The diagnostic follow-up passed 26 checks in Chrome with SwiftShader and native NVIDIA D3D11, and in Edge with native NVIDIA D3D11. The saved Gradient Flow hero on the local `/services/web-development` route also drew on Intel UHD 630 D3D11 without browser exceptions. TypeScript and the eight service shader unit tests passed. The reported generic compilation failure could not be reproduced with the current source. Reload the page after updating a failed renderer; if it still fails, capture the new stage-specific error and driver diagnostic rather than the previous generic console entry.

## Install and register

```bash
bun run shader:add -- FluxLines --dry-run
bun run shader:add -- FluxLines
```

The trusted developer-only command previews shadcn changes, installs under `shaders/react-bits`, checks the actual primary entry, then creates an adapter and a draft definition. It refuses duplicates (including an existing component outside that folder), never overwrites source, never auto-moves vendor files and never runs from the website. If the CLI fails or writes unexpected targets, inspect its output and `git diff`; dependencies/helper files may remain and are not blindly reverted.

The current CLI's dry-run display may show the default component path rather than its actual `--path` destination. A real FluxLines installation was verified in a disposable project: the installed source, adapter and draft landed in the expected shader folders. Always trust the script's post-install filesystem verification, not the preview path alone.

Review the installed component's actual interface, imports, cleanup and performance. Fill the strict Zod schema, defaults and controls; the application does not infer imaginary props. Unconfigured drafts are excluded from the manifest; configured drafts are included with `defaultActive: false` and become activatable in the admin after deployment. Confirm the adapter exports a component accepting the validated JSON contract; wrap vendor props where needed. Keep the definition as a draft and verify it in browser tests before deployment and admin activation. Add a version/migration before breaking old saved configurations.

```bash
bun run shader:sync
bun run shader:check
bun run test
bun run test:unit
bun run test:shaders:browser
bun run build
```

`shader:sync` generates `schemas/shaders.manifest.json` and copies the exact bytes to the sibling `Backend/assets/shaders.manifest.json`. It is an explicit developer command for this two-repository workspace, not a runtime write or deployment action. Commit both copies and the shader source. `shader:manifest` updates only the frontend artifact; `shader:check` validates definitions and fails if that artifact is stale. CI runs the check and real browser lifecycle checks. Tests use a Bun plugin to apply the same filesystem discovery that Vite's glob provides in production.

The backend embeds its committed manifest into the binary, compiles JSON Schema validators once, checks it during startup, and rejects unknown IDs/versions, extra executable properties and out-of-range values. `GET /api/v1/admin/shaders` requires `services:write` and returns persisted availability plus `canManage`. `PUT /api/v1/admin/shaders/{id}/activation` requires `services:publish` and an exact version/contract. The authenticated same-origin frontend bridge forwards only that metadata and an active boolean. The editor compares deployed contract hashes before offering effects and before Save; mismatched frontend/backend contracts fail closed. Backend publication still enforces RBAC, optimistic versions, activation and verified media ownership/references.

## Release and rollback

1. Commit the matching manifests to both repositories, together with definitions/adapters and the existing Orb source if it is newly installed.
2. Deploy the backend first so it accepts the new contracts; migrations continue to run through the existing API deployment script.
3. Deploy the frontend, activate configured drafts in the shader library, and verify all six slots using at least two different effect types; save/reload and check full-hero shaders, unchanged image framing, SSR backgrounds, scroll fades/reversals, keyboard controls and reduced motion.
4. Configure only JSON in the admin. Installing/upgrading source always requires a new build/deployment.
5. For content rollback choose Image/Existing image / video/Default illustration and Save; old images and video files are not deleted. Keep older runtime/schema versions until saved configurations are migrated. Unknown versions safely render posters on older frontends; their backend may reject edits until contracts are restored.

References: [shadcn CLI](https://ui.shadcn.com/docs/cli), [Vite glob discovery](https://vite.dev/guide/features.html#glob-import), [Zod JSON Schema](https://zod.dev/json-schema), [Rust JSON Schema](https://docs.rs/jsonschema/latest/jsonschema/).

## Initial verification snapshot, 2026-10-26

The following snapshot describes the original poster-based implementation. Current shader fallback behavior is background-only, as documented above and verified below.

- Frontend TypeScript, production SSR build and all 167 Bun tests passed. Definition/manifest checks passed and both repository manifest files match byte-for-byte.
- Real headless Chrome ran 20 shader checks with software WebGL2: both effects survived Strict Mode effect replay and kept drawing without graphics errors; prop updates kept the canvas; scrolling never created simultaneous active contexts; buffers/programs, motion listeners and contexts were released. Reduced motion, hidden tabs, context loss, unsupported WebGL, unknown versions and intentional lazy-import failure showed posters. The saved Gradient Flow hero also drew on the local service route after SSR hydration, without browser exceptions. The existing 10 browser WebP conversion checks also passed.
- The mock installer tested preview-only mode, draft scaffolding, adapter paths, duplicate/input rejection and unexpected vendor targets. A real upstream FluxLines preview and installation also succeeded in a separate disposable project; no FluxLines source/dependencies were installed into this workspace.
- Backend `cargo fmt --all -- --check`, `cargo clippy --locked --all-targets` and `cargo test --locked --all-targets -- --include-ignored` passed: 33 unit and 23 integration tests, with none ignored. Database tests used a separate temporary loopback PostgreSQL 18 cluster, not the existing local/production database. Initial Cargo runs encountered a Windows executable lock; the final full Cargo command succeeded after it cleared, without terminating the local API.
- Frontend deployment workflow passed actionlint. A Docker scratch-stage context/export check confirmed the exact manifest survives `.dockerignore` and can be copied; the full backend image was not built. Production R2/storage requests, production deployment, hardware-GPU/mobile performance and interactive production-admin acceptance were not performed. No environment credentials, Git commits or branches were changed. The pre-existing Orb source and registry configuration were preserved.

## Full-hero and background fade verification, 2026-10-26

- All 178 frontend unit tests, TypeScript, manifest checks and the production SSR build passed. Image and legacy-media hero framing/loading remain covered separately from the full-section shader layout.
- All 38 real-browser shader lifecycle checks passed with SwiftShader and native NVIDIA WebGL2. Checks include intermediate entrance/exit opacity, scroll reversal without canvas replacement, serialized GPU handoff, background-only error states, reduced motion and resource cleanup.
- The running local `/services/web-development` page was checked in Chrome at 1440×1000 and 390×844: shader canvas dimensions match the entire hero, there is no inline hero shader card or fallback image, and scrolling releases the hero renderer. Screenshots were inspected; no content was saved or changed.
- All 35 Rust unit and 26 PostgreSQL integration tests passed, including create/edit/public reads with no poster or asset references, optional empty posters and rejection of unverified nonempty poster URLs. The normal all-target Cargo test command encountered a Windows executable lock; the newly compiled integration harness ran directly instead. Rust formatting and Clippy passed. The isolated temporary database cluster was stopped and removed; existing local/production databases and credentials were not changed.
