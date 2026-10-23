# Cinematic sections

Each section and shared UI helper has its own file. `HomePage.tsx` imports sections directly; the canvas, shaders, project gallery, and shared motion hooks remain in their existing home-scoped modules.

`reviews/CinematicReviews.tsx` follows the reference's dark dotted surface, moving wordmark strip, centered badge, and raised hover cards. It is rendered at the bottom of `CinematicHero.tsx`, replacing the technology ticker. Reviews scroll natively with touch, keyboard, or arrow controls. Read-more buttons expand quotes in place.

The wordmark animation pauses offscreen, when the document is hidden, on hover/focus, or through its pause control. The homepage's reduced-motion setting disables movement.

The default quotes in `reviews/reviews.ts` are explicitly labeled samples. Replace them with approved quotes and author details, removing `sample: true` only for genuine feedback. Pass a `reviews` array to reuse the section with real content. Toolkit names identify technologies, not client endorsements; the project count comes from the existing portfolio data.
