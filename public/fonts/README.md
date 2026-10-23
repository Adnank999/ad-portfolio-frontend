# Portfolio typography

Body text and form controls use the local variable `Inter-Variable.ttf` (weights 100–900). Its license is in `OFL-Inter.txt`. Inter is preloaded by the root document.

All h1 headings request `PP Editorial Bold` at weight 700 through `--font-display`. By default, h2, h3 and span elements, including spans nested in h1, request regular `PP Editorial` at weight 400 with normal style through `--font-editorial`, except for the homepage headlines listed below. A base-layer important typography rule overrides component font shorthands and Tailwind font utilities without changing font sizes or line heights. Other secondary headings (h4–h6) and navbar labels retain their regular editorial defaults. Navbar headings deliberately use extra tracking for readability.

No licensed PP Editorial Regular or Bold files are currently supplied. Both font faces check locally installed variants and fall back to Georgia when unavailable; no missing font URLs are requested.

The homepage hero ("Ideas into reality." / "Built to evolve.") and closing contact headline ("Your next idea." / "Let’s make it real.") are scoped exceptions: their headings and all animated word wrappers request `PP Editorial Bold` at weight 700. Other h2, h3 and span elements remain regular. These exceptions do not change text sizes or line heights.

Font faces and typography tokens are defined in `src/styles/app.css`. To host PP Editorial, add your licensed Regular and Bold font files to this folder, then add each `url('/fonts/your-font.woff2') format('woff2')` source to the matching font face. Only preload actual files that are present.

The About hero name is a scoped exception: its first line uses `stranger things/Stranger Things Outlined.ttf`, and its second uses `stranger things/Benguiat Bold.ttf`. Both load only when used and share the same purple/pink text gradient. “KHAN.” stays at `1.1em`. Other headings retain the editorial defaults. JetBrains Mono and FK Screamer files are retained but are no longer active site fonts.
