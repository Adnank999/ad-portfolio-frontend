# Project shared-element transitions

The existing TanStack Router owns native view transitions. The installed stable React build does not require experimental React APIs or a package upgrade.

`projectTransitionStyle(slug, part)` assigns a unique name and shared styling class to the image, title, description, and category on the gallery card and detail hero. Never reuse the old generic `project-image` name across multiple cards. Each project has one matching element per part in a rendered view.

`useProjectTransition()` supplies the router Link option and updates when reduced-motion preferences change. CSS also neutralizes browser-history transitions for reduced motion. Browsers without native view transitions navigate normally; browsers without view-transition classes retain the browser's default shared-element animation.

The detail hero does not run an overlapping entrance fade: its named elements must already be visible when the router captures the destination. Image slots reserve their aspect ratios, gallery images load lazily, and the detail hero image loads eagerly. The persistent navbar is isolated from page snapshots.

Navigation map: `/projects` → `/projects/<slug>` shares the selected card's media and text; the Work backlink and browser Back restore the gallery. Related-project links use the router's ordinary page transition because they are lateral navigation. Related previews are deliberately unnamed so unrelated gallery cards do not morph into previews below the detail page. Direct visits render normal project content.

References: https://tanstack.com/router/latest/docs/api/router/ViewTransitionOptionsType and https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/view-transition-class.
