# Shader activation library

Open **Admin → Shaders** in the workspace sidebar (`/admin/shaders`). Activation is independent of the service editor. `ShaderLibraryPage.tsx` owns catalog loading, actionable errors and retry; `ShaderLibrary.tsx` displays the always-visible library and activation controls. Service forms retain only section selection/prop controls and a link to this page.

Users with `services:publish` can activate or deactivate configured, matching deployed shader contracts. The existing `services:write` permission permits viewing the library; it does not grant activation. Activation is an immediate authenticated, same-origin mutation, stored in PostgreSQL by shader ID/version/contract, and updates the shared admin catalog query. It does not save a service form or change source files. A failed catalog refresh disables stale activation controls until a successful retry.

Prepared definitions can remain source-level drafts. The manifest includes their validated schema/defaults/controls with `defaultActive: false`; the admin activates them after deployment. Empty drafts display Needs setup and cannot be activated. Source-level ready definitions default active for compatibility, while persisted overrides survive deployments. A changed contract/version does not inherit a previous contract's override.

Inactive shaders cannot be assigned to a new service slot. Existing assignments remain renderable and editable so disabling a library entry does not break live pages. Replacing one requires an active shader. The backend enforces this even if a caller bypasses the picker.

The activation table requires the backend migration `202610270001_shader_activation.sql`. A missing table returns HTTP 503 with `shader_schema_unavailable` and migration instructions, never a fabricated active catalog. Run the backend's normal migration command against the same database used by the API, restart the API and Retry shader catalog. See `Backend/docs/service-visuals.md` for recovery steps.

Coverage includes standalone route/sidebar separation, loading/error/retry and stale-data safety, same-origin metadata forwarding, configured vs empty drafts, shared picker cache updates, unauthorized/editor activation, stale hashes/versions, persisted availability, missing-migration recovery, inactive assignment rejection and preservation of existing public service visuals.

Standalone-library verification: 175 Bun tests, TypeScript, manifest checks and the production SSR build passed. Rust formatting, Clippy and 59 tests (34 unit, 25 integration, none ignored) passed against a temporary isolated PostgreSQL cluster. GPU/browser lifecycle checks were not rerun for this UI/database-diagnostic change; renderer code is unchanged. The existing local database could not be inspected because its `.env` connection failed authentication; no existing database migration or production deployment was performed.
