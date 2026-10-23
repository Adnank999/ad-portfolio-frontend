# Case studies by industry

`/case-studies` lists all studies. Each industry has a dedicated page component and file route at `/case-studies/industries/<slug>`. Individual stories resolve through `/case-studies/<slug>` using a validated loader and a real 404 for unknown entries.

The public data source is the backend case-study API, loaded server-side through `src/server/public-case-studies.ts` and TanStack Query. Navbar counts, industry filters, cards, schema item counts and related links use published database records. Static `src/data/case-studies/` entries are retained as the import source: ten industries, six portfolio studies, and seven explicitly fictional concepts. Gaming & Betting is not included. New studies are not added to the homepage project list.

Manage records at `/admin/case-studies`, including cover/gallery uploads, narrative, approach/outcome cards, SEO, additional JSON-LD, FAQs and reviewable AI suggestions. The editor initializes from the selected database record, not static defaults. Images replace study SVG artwork; concepts without supplied photos start with a raster placeholder. See `Backend/docs/case-studies.md` for migration, non-destructive import and permissions.

Shared structures are under `components/global/case-study-layout`, `industry-page`, and `case-study-page`. Industry artwork is local, decorative React/SVG UI. The detail layout follows the reference's dark introduction and light editorial story without replicating its empty pinned-scroll areas or inventing client metrics.

## SEO

`lib/caseStudySeo.ts` supplies server-rendered titles, descriptions, Open Graph/Twitter metadata, canonical links, `BreadcrumbList`, `CollectionPage`/`Article`, and `FAQPage` JSON-LD. FAQ content is taken directly from the same data rendered in accessible native `details` elements. Structured data serialization escapes `<` to prevent script-boundary injection.

Set `VITE_SITE_URL` to the public origin in the deployment environment for a stable canonical host. Without it, `lib/siteUrl.ts` uses the server request origin or browser origin through TanStack's isomorphic function. The root's inherited `example.com` canonical was removed to avoid conflicting canonical tags on these pages. No environment files are changed.

The shared 1200×630 social preview is `public/images/case-studies-cover.png`; its editable source is the adjacent SVG. This preview intentionally describes the whole collection rather than mislabeling a generic image as a client screenshot.

FAQ structured data is semantic markup, not a promise of a Google rich result. Google discontinued the FAQ rich-result feature in May 2026: https://developers.google.com/search/updates#may-2026. Head management follows https://tanstack.com/router/latest/docs/guide/document-head-management.

To add a genuine client case, first obtain approved copy and evidence. Replace or extend the data with verified context and measurements rather than silently relabel a concept. Keep status labels and schema consistent with the visible page.
