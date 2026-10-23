# Industry page structure

Pass an `Industry` from `src/data/case-studies`. The layout renders its art, introduction, computed study counts, category navigation, perspective, case cards, related industries, FAQs, and contact panel. Per-industry page components live outside this shared structure in `components/case-studies/<slug>/`.

Each route preloads the shared published-case-study query for SSR. Counts, cards, FAQs, related industries and filters use those database records, and the hero uses the first available study photo or the raster collection placeholder.
