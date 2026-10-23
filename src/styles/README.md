# Accent styling

`app.css` owns the solid accent (`--color-accent: #C21E56`), its shades and RGB glow value. Borders, icons, backgrounds, and focus rings remain solid. `--accent-text-gradient` blends that accent into `--accent-text-end: #7C0A02` at 110 degrees.

Keep `text-accent` or `text-accent-*` on the existing container and wrap its text in `<span className="accent-text">…</span>`. The color utilities activate the gradient on the inner text only, including hover, group-hover, and active variants. This preserves badge backgrounds, borders, and SVG currentColor. `text-white` resets gradient painting so filled buttons and white hover states retain normal text.

Use `accent-text-gradient` or `text-gradient` for standalone gradient text. Existing CSS-driven accent headings and links share the same tokens. Forced-colors mode restores normal text painting. Do not apply text clipping to entire cards or icon buttons.
