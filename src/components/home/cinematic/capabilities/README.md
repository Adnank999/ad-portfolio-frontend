# Built with care section

`../CinematicCapabilities.tsx` replaces the pinned three-item toolkit with a normal-flow, split introduction and six full-width accordion rows inspired by the supplied reference recording. The heading deliberately keeps “Build with Care from Front to Back”. Copy describes the portfolio's development work, not the reference site's AI marketing services.

`capabilities.ts` owns the copy and toolkit tags. `CapabilityArtwork.tsx` supplies six lightweight SVG compositions, with per-instance gradient IDs, shared accent colors, and no extra canvas, assets, rendering loop, or image downloads. Hovering a desktop row previews its artwork in the introduction; selecting a row opens its description and artwork.

Trigonometric coordinates are serialized at three decimal places. This prevents last-bit differences between server and browser math from producing hydration warnings. The hydration regression test perturbs browser trigonometry before hydrating all three affected diagrams.

Only one row opens at a time, and it can be collapsed. Buttons support Enter/Space natively plus Arrow Up/Down and Home/End for focus. Panels retain stable IDs, are inert and hidden from accessibility APIs when collapsed, and use zero-duration transitions when motion is reduced. Mobile keeps the main artwork and stacks the text without squeezing in duplicate thumbnails.

The existing homepage canvas and reverse shader transition remain connected to the section ref. The section itself has a solid charcoal surface so its content is readable throughout that transition. Typography follows the existing editorial headings, Inter body sizes, and `#C21E56` → `#7C0A02` text gradient; borders and diagrams use the solid accent.
