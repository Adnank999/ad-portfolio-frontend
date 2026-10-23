# Case study detail structure

Pass a validated `CaseStudy` from the route loader. The dark hero identifies the study's status and source. The light article contains context, problem, approach, technology choices, qualitative outcomes, lessons, and FAQs, with normal-flow content and a desktop sticky table of contents. No fabricated quantitative results or unbounded pinned scroll gaps are used.

The route reads published records from the API. Cover and gallery photos use saved image URLs and alt text rather than SVG artwork. A saved rich editor document replaces the structured narrative; backend-rendered FAQ HTML is removed from that body so the visible FAQ component is not duplicated. Stored SEO and additional JSON-LD are rendered server-side with script-safe serialization.
