# CMS contract fixtures

These public-content snapshots are committed to the frontend repository so its tests run from a frontend-only checkout. Unit tests must not read the sibling Backend repository, which is absent in the frontend GitHub Actions job.

| Fixture | Source in the backend repository |
| --- | --- |
| `services.json` | `examples/services.json` |
| `case-studies.json` | `examples/case-studies.json` |
| `service-content.schema.json` | `examples/service-content.schema.json` |

Initial snapshots come from backend commit `881efeb0ae44c4d49c1f1353fa92f8997fe83ffb`. They preserve the existing CMS, AI editor, and frontend/schema contract coverage without requiring a backend checkout, backend credentials, or network access.

When the shared content contract or published seed content intentionally changes, update the corresponding snapshots from the reviewed backend files and run `bun run test:unit`. Keep the schema snapshot aligned with `src/lib/services/page-content.schema.json`. Snapshot refreshes are explicit; tests never copy or rewrite backend files.
