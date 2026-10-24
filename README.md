# Adnan Hossain Khan — Portfolio

Premium developer portfolio built with TanStack Start, TanStack Router, Tailwind CSS v4, shadcn-style primitives, Framer Motion and native View Transitions.

## Run

This project includes the required `src/router.tsx` entry used by the current TanStack Start Vite plugin. The generated `src/routeTree.gen.ts` is created automatically when the dev server starts.


```bash
bun install
bun run dev
```

Open http://localhost:3000

Use Bun to install dependencies: the checked-in Fiber Timer compatibility patch is applied through `patchedDependencies`. See `patches/README.md`.

## Production SSR

For GitHub Actions testing, SSR builds, and deployment to the existing native Ubuntu systemd service, follow [frontend CI/CD setup](deploy/README.md). The automated pipeline does not use the optional frontend Docker deployment below.

This is a TanStack Start application: `vite build` already compiles both browser assets and the server-rendered application. Nitro packages that SSR handler with a production Node HTTP server and static asset serving. Nitro is a deployment adapter, not a requirement for SSR itself. The configured `node_server` preset produces a standalone `.output/` directory:

```text
.output/
  public/            browser assets and files from public/
  server/index.mjs   production Node server
```

`bun run dev` starts Vite for development. `bun run build` builds the production client and SSR server. `bun run start` runs `node .output/server/index.mjs`; it requires a completed build and runtime environment variables. `bun run preview` keeps Vite's local preview command separate from production hosting.

Use Node 22.12 or newer; the Docker image uses Node 24. Install with Bun so the Fiber compatibility patch is applied. Nitro is pinned in `package.json` and `bun.lock`; its currently published Vite adapter is a beta, so validate builds before upgrading it.

### Run directly on Ubuntu

From this frontend directory, create a private production environment file if one does not exist:

```bash
cp -n .env.example .env.production
chmod 600 .env.production
nano .env.production
bun install --frozen-lockfile
bun run build
node --env-file=.env.production .output/server/index.mjs
```

Set `APP_ORIGIN` to the exact public HTTPS origin, including any nonstandard port and without a trailing slash. It is used for request-origin checks and secure cookies. Set `PORTFOLIO_API_URL` to the Rust API URL reachable from the SSR process, normally `http://127.0.0.1:8080` on the same Ubuntu server. Supply the optional R2 settings for media uploads. These are runtime server variables: do not prefix API credentials or R2 secrets with `VITE_`.

The plain Node entry does not automatically load Vite's `.env` files. Use the explicit `--env-file` command above, or have systemd/the hosting platform inject the environment and use `bun run start`. Keep the process running with your service manager. A prebuilt deployment needs the complete `.output/` directory and Node, including any dependencies traced into `.output/server/node_modules`; it does not need the source tree or root `node_modules`.

### Run in Docker on Ubuntu

After preparing `.env.production` as above:

```bash
docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production up -d --build frontend
docker compose --env-file .env.production logs --tail=100 frontend
curl --fail http://127.0.0.1:3000/
```

The multi-stage Dockerfile installs dependencies using the frozen Bun lockfile and builds SSR, then copies only `.output/` into an unprivileged Node runtime. `.dockerignore` keeps local environment files out of the build context. Compose injects `.env.production` at runtime.

The supplied Compose file targets Docker Engine on Ubuntu and uses host networking, matching `../Backend/docker-compose.yml`. The frontend listens on `127.0.0.1:3000`, calls the Rust API on `127.0.0.1:8080`, and leaves PostgreSQL on Ubuntu. No Docker `ports:` mapping is needed. Docker Desktop requires its optional host-networking feature for this topology.

Run Nginx/Caddy on Ubuntu to terminate HTTPS and proxy the frontend domain to `http://127.0.0.1:3000`. Forward the original host and protocol, allow the existing media-upload sizes, and disable response buffering for SSR streaming. Send page requests and server-function/upload routes to Node; serving `.output/public` alone would omit SSR, authentication, and server functions. Avoid caching authenticated responses at the proxy.

Check both HTML and static assets after deployment. Page source should contain rendered text before browser JavaScript runs, and `.output/public/assets` files must remain available. Update placeholder canonical domains under the existing Production TODO before launch.

References: [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [Nitro Node deployment](https://nitro.build/deploy/runtimes/node), and [Vite preview](https://vite.dev/guide/cli.html#vite-preview).

## Content workspace

Run the Rust API in `../Backend` and set `PORTFOLIO_API_URL` in the frontend server environment (defaults to `http://127.0.0.1:8080`). Set `APP_ORIGIN` to the exact frontend origin in production. The workspace lives at `/admin`; `/login`, `/register`, `/forgot-password`, and `/reset-password` are public routes. Public registration creates an account without admin permissions. Bootstrap the owner with the backend CLI, then assign editor roles through the API before other accounts can use the workspace.

The workspace uses TanStack Query for account and content data, Tiptap for rich blog/project content, and the backend's authenticated content API. It keeps only a short-lived access token in an HTTP-only, SameSite=Strict cookie. Sign in again when the token expires. Public blog pages now load published articles from the backend with server-rendered rich content and saved SEO settings. Public project pages still use their local data file.

For image uploads, configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and `R2_PUBLIC_URL` in the frontend server environment. `R2_PUBLIC_URL` must be the public HTTPS base URL for the bucket (prefer a custom domain). Uploads travel through a same-origin, authenticated, 8 MB-limited server endpoint; R2 credentials never reach the browser. Do not commit real credentials.

For password recovery, set the backend SMTP variables listed in `../Backend/.env.portfolio.example`. Without SMTP configuration, recovery requests return a service-unavailable error. Run backend migrations before starting the updated API.

## AI content assistance

Blog and Project create/edit forms have a Generate with AI action for owners/admins. Enter factual context, choose fields and writing settings, then review proposals before applying selected values to the unsaved form. Applying proposals does not save or publish content. Existing images, external URLs, and publishing controls are preserved. Filled values require replacement confirmation; changes made during generation require fresh review.

Configure Gemini only in `../Backend/.env.portfolio`: `AI_PROVIDER=gemini`, `AI_API_KEY`, and `AI_MODEL=gemini-3.5-flash-lite`. Optional time/token/quota limits are documented in `../Backend/docs/ai-content.md`. Restart the backend after configuration. No AI key belongs in the frontend environment. Run `bun run test:unit` for the generator's mocked component/contract tests.

## Replace project content

Edit `src/data/projects.ts`. Project cards and detail pages are driven entirely from this typed data source.

## Service administration

Services now use the backend content store. Apply backend migrations and run `cargo run --bin portfolio-api -- import-services` once (or `cargo run --example import_services` for combined migration/import). This imports all 13 existing pages and navbar entries without overwriting later edits. Restart the API after updating it.

Manage `/admin/services` to toggle page/navbar visibility, edit navbar title/description/group/order, edit every existing page section, upload images or MP4/WebM video, and manage FAQs, SEO and AI proposals. Disabled services return 404 and leave the sitemap; hiding only the navbar entry keeps its page available. Images use the existing 8 MB limit, videos allow 64 MB, and R2 storage must be configured. See `../Backend/docs/services.md` for permissions, APIs and setup.

## Loading and recovery

Shared loading and error views live in `src/components/feedback/`, with their isolated styles in `page-feedback.css`. The router uses these as global pending/error defaults; blog and case-study routes, project scene startup, and admin content lists/editors reuse the same design. Route loading waits 200 ms before appearing and remains visible for at least 350 ms to avoid flashes. The project scene keeps its immersive-experience message and its readable WebGL-unavailable fallback.

Errors offer a real retry and a home link without displaying internal exception details. Route retries invalidate loaders and reset query error boundaries; admin retries refetch the failed query without replacing an already loaded editor. The document shell remains mounted around route errors.

The loading emblem in `src/components/feedback/loading-logo/` loads `public/loader/crimson_logo_optimized.glb` using a dynamically imported Three.js/GLTF renderer. The supplied meshes and embedded textures are preserved. The original asset is not modified. The model is centered and uniformly fitted inside the ring; only emissive highlights animate, not its geometry or rotation. Vite adds a SHA-256 content version to the shared preload/render URL so replacing the file bypasses older browser caches. During development, changing the GLB restarts Vite and reloads the page to clear decoded-model and poster caches. Production updates require a new build and deployment.

`LoaderPreload` starts an idle, client-only background warmup after application startup (skipped for Save-Data connections). The renderer module, GLB, decoded textures, and fitted geometry are cached for the page session. Concurrent loaders share one request and one parse; failed warmups can retry. Each visible loader clones only its materials, so unmounting it cannot invalidate the cached asset or another loader. A temporary hidden WebGL context prepares the shaders and captures a small snapshot of the actual model, then is released. Subsequent loaders show that snapshot immediately while their own GPU context finishes preparing, without substituting a different shape. The first visit still needs time to warm up; a full browser refresh starts a new in-memory session.

The renderer is capped at 30 FPS and a 512-pixel canvas / 1.5 DPR, and pauses when hidden or offscreen. Unmount cancels its work and releases per-instance materials, environment, and WebGL context; shared geometry and decoded textures intentionally remain cached until the page closes. Reduced motion freezes the highlights. Before the first warmup, a glowing ring appears during SSR or while the asset loads. If WebGL or the model is unavailable, the ring and accessible text remain usable. The bar is indeterminate. Use `loading-logo/model.ts`, `renderer.ts`, and `page-feedback.css` to tune framing, lighting, and glow.

## Terrain project routes

`/projects` opens the integrated WebGL2 terrain, with a Home-only header and editorial introduction. `/projects/:slug` uses clean 80%-width hero images, 60:40 detail layouts and a shader-powered fullscreen media-gallery launcher. Components and all engine modules live in `src/components/terrain-recreation/`; isolated styles are in `terrain.css` and `gallery/gallery.css`. Assets live in `public/terrain/`, with no dependency on the original prototype folder. One canvas persists between project routes; SSR/WebGL-unavailable visitors receive normal project content. Press **P** for the hidden controls. Add optional image/video `media` entries in `src/data/projects.ts`. See [terrain integration and controls](src/components/terrain-recreation/README.md).

## Production TODO

- Replace `https://example.com` canonical URLs with the real domain.
- Replace placeholder project images with final assets.
- Add real GitHub/LinkedIn URLs and email.
- Add `robots.txt` and sitemap generation for the deployed domain.
- Add a real contact form endpoint if required.

## Routes

The portfolio uses dedicated routes instead of hash sections:

- `/` — Home
- `/about` — About
- `/projects` — Projects
- `/projects/:slug` — Project detail
- `/experience` — Experience
- `/contact` — Contact

Internal route navigation uses TanStack Router's native View Transitions support via `defaultViewTransition: true`, with CSS transition polish and browser fallback.
