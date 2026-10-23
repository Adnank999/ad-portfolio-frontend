# Article contents

`ArticleToc` takes `{ id, title }[]` and the body container's `articleId`. Every item must point to a real section with a matching ID. Native anchor links and a mobile `details` disclosure work without JavaScript.

Desktop contents remain sticky, with an active section and reading progress. A single passive scroll listener schedules measurements with `requestAnimationFrame`; listeners, resize observation, and pending frames are cleaned up on unmount. Only changed section/progress values update React state.
