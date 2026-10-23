# Service pages

Public services are database-backed. The dynamic TanStack route `services.$slug.tsx` loads `/services/<slug>` through the public service API, including saved SEO, media and content. The original folders and `content.ts` files are retained as the source of import defaults, not the live content store.

The shared layout is `components/global/service-page/ServicePage.tsx`. Edit live service copy, sections, navbar metadata and visibility at `/admin/services`. The index, desktop/mobile navbar and related-service links read the public database collection. The navbar's All services destination points to `/services`. See `Backend/docs/services.md` for import, permissions, media, SEO and AI setup.

All 13 services are represented. Nearshore, ERP, and Paid Media use the supplied overall visual direction where no unique page reference was provided. Nearshore copy explicitly explains the actual Bangladesh-based remote collaboration rather than claiming a local agency team. No vendor affiliation, guaranteed outcome, price, or client endorsement is asserted.

Each page explains the problem, scope, typical deliverables, acceptance checks, practical use cases, delivery stages, engagement options, and preparation for the first conversation. Eight service-specific FAQs cover the decisions a prospective client needs to make. Keep the voice direct and consistent with an independent developer; make client responsibilities and specialist dependencies explicit where they affect scope.

`deliverables` and `preparation` are required page sections. `faqTitle` gives each FAQ section a descriptive service-specific heading. SEO falls back to the saved title and description, with optional metadata overrides in the editor. Navbar titles and descriptions are saved independently. Images and videos can replace each SVG illustration; unset slots preserve the original artwork.

Blog entries are non-interactive coming-soon cards. No article routes or common post-blog CTA/ticker sections are created. The existing application footer remains unchanged.

SEO and GEO/AEO copy was checked against Google's [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) and [AI features guidance](https://developers.google.com/search/docs/appearance/ai-features). Keep descriptions of third-party discovery behavior qualified, and recheck the relevant official guidance when changing those claims.
