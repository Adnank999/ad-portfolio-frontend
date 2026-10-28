# Production performance checks

Measure the built Node server, not `bun run dev`. Vite's development modules, React refresh, and uncompressed dependency downloads are not representative of the deployed application.

```bash
bun run build
PORT=4177 node .output/server/index.mjs
```

In PowerShell, set `$env:PORT='4177'` before starting Node. Warm the SSR server with one HTTP request, then use a fresh browser/cache for each Lighthouse navigation. Use the same Lighthouse version, mobile network/CPU settings, browser, and graphics flags for comparisons. Run three audits sequentially and compare medians. Do not run builds or browser suites during an audit.

Lighthouse 13.5.0 was used for this investigation. It can be installed in an ignored tool directory without adding it to application dependencies:

```bash
npm install --prefix .deploy/perf-tools --no-audit --no-fund lighthouse@13.5.0
node .deploy/perf-tools/node_modules/lighthouse/cli/index.js http://127.0.0.1:4177/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=.deploy/performance/audit.json
```

The local comparisons used headless Chrome with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`. This makes graphics tests reproducible without requiring a physical GPU; it is not a measurement of a production phone's GPU. Lighthouse also warned that this host CPU was slower than expected. Confirm results on the deployed HTTPS origin and representative real devices after deployment.

## What the application now does

- Nitro generates Brotli and gzip variants for public assets. The Node server negotiates these variants; deploy the **complete `.output/` directory**, including `.br` and `.gz` files.
- A Nitro plugin streams gzip for public, anonymous HTML. It preserves streaming and does not transform API responses, authentication pages, requests with cookies/authorization, or responses setting cookies. It respects encoding refusal, existing compression, `no-transform`, and range requests. It does not cache HTML.
- Inter uses a smaller Latin WOFF2 face first, with a complete WOFF2 face for the remaining original glyphs. The Latin face keeps standard shaping, kerning, and numeric variants; the complete face retains the original optional stylistic features. The source TTF remains available for regeneration. The font metrics and variable axes are preserved.
- The closed search dialog loads only when opened. Admin styles load with the admin route; authentication button styles stay with the auth frame.
- Navigation starts with a glowing SVG mask. Its electric effect is imported on hover or keyboard focus, keeping idle navigation free of another WebGL renderer. Its traced shape is cached, bounded to 128 px, and drawn at DPR 1 with a 30 FPS limit. Hidden/offscreen renderers stop; reduced-motion and Save-Data/2G users keep the SVG.
- The homepage prepares shader programs with non-blocking completion checks when supported and uploads one source texture per browser task. Preparation is cancellable. Existing fade-out, resource release, compiled-program reuse, and scroll-return behavior remain covered by browser checks.
- The static lower particle artwork is one lazily loaded SVG image instead of 280 hydrated SVG circles. Its positions, colors, and filters are generated from the existing particle data.
- Public fonts, the logo, and the static particle SVG have a one-day cache lifetime. Hashed Vite assets retain Nitro's immutable cache headers.

## Verification

```bash
bun run test
bun run test:unit
bun run test:logo:browser
bun run test:home:browser
bun run test:loader:browser
```

On a busy development machine, `bun run test:unit --timeout 15000` gives existing CMS integration tests more time without changing the checked-in timeout or assertions. Report which command was used.

Verify response headers through the actual reverse proxy as well as the Node server:

```bash
curl -D - -o /dev/null -H 'Accept-Encoding: gzip' http://127.0.0.1:4177/
curl -I -H 'Accept-Encoding: br, gzip' http://127.0.0.1:4177/assets/ACTUAL-HASHED-FILENAME.js
```

HTML gzip applies to GET responses; HEAD does not run the HTML transformation. On Windows, use `curl.exe` and `-o NUL`. Confirm `Content-Encoding`, `Vary: Accept-Encoding`, correct MIME types, and cache headers. Avoid double compression if the reverse proxy also compresses responses.

Regenerate committed static assets only when their source changes:

```bash
# Requires fonttools and brotli in a development Python environment.
python scripts/prepare-fonts.py
bun scripts/prepare-particle-fallback.ts
```

## Local results — 28 October 2026

Three cold-browser mobile audits were run against each production build, with the Node server warmed first. The same Lighthouse 13.5.0 and Chrome/SwiftShader flags were used. Reports are in the ignored `.deploy/performance/` directory (`before-1..3.json` and `result-1..3.json`).

| Metric | Before median | After median |
| --- | ---: | ---: |
| Performance | 27 | 56 |
| First Contentful Paint | 7.85 s | 3.17 s |
| Largest Contentful Paint | 13.77 s | 3.86 s |
| Total Blocking Time | 5,328 ms | 779 ms |
| Cumulative Layout Shift | 0.00091 | 0.00277 |
| Transferred bytes during audit | 4,239,590 | 347,301 |
| Accessibility | 96 | 100 |
| Best practices | 96 | 100 |
| SEO | 100 | 100 |

These are improvements, not a claim that the mobile targets have all been reached. LCP remains above 2.5 seconds and TBT above 200 ms. Final performance scores ranged from 49–60 and TBT from 636–2,381 ms. Deferred graphics loaded within different measurement windows: the graphics-loaded run transferred 1,366,091 bytes, while the other two transferred 347,301 bytes before the graphics finished loading. The three-run median and the range both matter; the smallest transfer/fastest run should not be treated as the complete graphics payload.

The initial font request fell from 876,576 bytes to 70,388 bytes. Anonymous homepage HTML was verified as a roughly 13.6 KB gzip stream, with Brotli served for hashed JavaScript/CSS and one-day cache headers served for fonts and the logo. The original user-supplied development-server audit transferred about 28.2 MB; it is not the production baseline in this table.

Automatic hero WebGL is retained. Its startup remains the main unresolved mobile blocking cost; an intermediate hardware-accelerated audit also showed expensive initialization, so this is not attributed solely to software rendering. An optional mobile mode with a lightweight background would be a user-visible product choice, not a silent benchmark-specific change. Recheck the deployed HTTPS site on physical mobile GPUs before deciding on that tradeoff.

Final verification:

- `bun run test`: TypeScript passed.
- `bun run test:unit --timeout 15000`: 195 passed, 0 failed.
- `bun run test:logo:browser`: 23 passed, including hover, keyboard focus, idle behavior, suspension, cached tracing, and cleanup.
- `bun run test:home:browser --native-gpu`: 46 passed on the RTX 2060, including repeated scroll returns, real colored pixels, one-context initialization, quality rebuilds, and unsupported-renderer fallback. The supported-path checks also passed with SwiftShader.
- `bun run build`: passed.
- Built-site browser checks passed for keyboard search, result updates, Escape/focus restoration, mobile overflow, reduced motion, and absence of uncaught exceptions.
- Actual browser text widths, kerning, and ligatures matched the source TTF at weights 400, 500, 600, and 700. FontTools checks confirmed unchanged glyph metrics, variable axes, and full fallback character coverage.

For interaction checks, open search using the keyboard, type a query, and press Escape; focus should return to the trigger. Scroll below the homepage particle section and return to the top twice. The shader must fade back in with colored pixels, retain one canvas, and avoid fetching/transcoding its textures again. Repeat with reduced motion and after hiding/showing the tab.
