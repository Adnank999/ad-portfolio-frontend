# Service page structure

`ServicePage` renders typed `ServiceContent`, supplied by the database-backed `services.$slug.tsx` route. The original `components/services/<route-slug>/content.ts` files provide import defaults. Live copy and sections are edited in `/admin/services`; related links use the enabled public collection.

The shared structure contains a hero, overview, comparison, solutions, deliverables with acceptance criteria, visual spotlight, working contexts, tools, practical scenarios, five-phase process, engagement models, preparation checklist, optional portfolio links, FAQ, related services, and blog-card placeholders. Deliverables and preparation have their own in-page navigation links. Native `details` elements provide keyboard-accessible accordions without animation dependencies. Blog cards intentionally have no links or fake buttons.

Visual slots use `ServiceMedia` to display uploaded images or videos with controls, alt text/descriptions, optional posters and captions. Slots without media retain the local decorative SVG components. IDs are instance-safe and text conveys the same information. Typography uses the existing FK Screamer and JetBrains Mono tokens. Styling is Tailwind; no packages are added.

A selected hero shader covers the complete hero as a background beneath the existing readability overlay and foreground content. It does not add an inline media card. Hero images/videos retain their existing framed layout below the summary. Every shader slot fades over the page's `#151515` background rather than an image fallback; reduced motion and unsupported WebGL remain still.

New pages stop after the blog cards. The root document continues to render its existing footer; no common post-blog CTA, ticker, or footer section is duplicated.

Copy is specific to the portfolio, not the agency in the references. Do not publish unsupported prices, client logos, certifications, locations, or outcome claims.
