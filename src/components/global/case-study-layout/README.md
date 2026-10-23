# Shared case-study UI

`CaseStudyLayout.tsx` contains the shell, visible breadcrumbs, industry navigation, study labels/cards, FAQ, and contact panel used by the case-study structures. `IndustryArtwork.tsx` supplies local category-specific artwork. All layouts use the existing font tokens and Tailwind, with native links and native disclosure controls.

The collection data owns counts and statuses; UI components do not maintain duplicate counts. Concept labels remain visible on cards and detail pages. No client reviews, endorsements, or numerical business outcomes are generated.
