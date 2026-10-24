# Shared admin image uploads

`image-presets.ts` defines browser policy identifiers that mirror Rust. `convert-to-webp.ts` validates still raster sources and converts them only inside client events. `direct-upload.ts` performs JSON presign → raw browser R2 PUT → JSON complete and retains sessions per selected File so Retry resumes completion instead of reuploading.

`queries/assets/upload.ts` integrates the flow with TanStack Query. `AdminImageUploads` shares pending state and approved asset IDs across the content form, galleries, service slots and rich-text editor. The existing content DTO sends `assetIds`; Rust remains authoritative for identity, purpose, ownership and ready state. Browser code never has R2 access/secret keys.

The existing same-origin `/api/admin/media` route now accepts small allowlisted JSON actions and forwards them through the established private API client with Origin checks and session bearer forwarding. It does not forward image bytes in direct mode. The direct image PUT is a browser `fetch()` to the opaque R2 S3 URL with the exact returned headers and `credentials: omit`.

Enable private runtime `ADMIN_DIRECT_R2_UPLOAD=true` only after backend `R2_DIRECT_UPLOAD_ENABLED=true`, its database migration and real R2 CORS/PUT/copy verification succeed. Until then the explicit rollback route converts the image but uploads it through the legacy server path. New-mode errors never fall back silently. Videos remain on their original path. Existing GIF/AVIF images remain readable, but new sources are still JPEG/PNG/WebP only.

Full provisioning, validation, cleanup, rollback and smoke-test instructions: backend `docs/direct-image-uploads.md`. The source checkout on the VPS need not be updated for Rust changes: deploy its new Docker image. Frontend SSR source changes require the existing frontend build/deployment; change runtime flags in the existing production environment rather than committing secrets.

Run `bun run test:media:browser` for actual headless Chrome/Chromium/Edge canvas conversion checks (PNG alpha, JPEG cover crop, existing WebP, downsize, encoding fallback, cancellation). Set `CHROME_BIN` if the executable is not found. This installs nothing and uses a temporary browser profile and loopback-only fixture server; it does not contact R2. Real-account PUT/CORS/copy and interactive admin verification remain separate acceptance checks.
