# Global components

New components belong in their own kebab-case folder with their related helpers, styles, and documentation.

## VaporText

`vapor-text/VaporText.tsx` cycles words through overlapping particle condensation and drifting vapor. It includes the Ink, Mist, Steam, Dust, Bloom, and Frost presets, mouse interaction, and click-to-advance. See `vapor-text/README.md` for usage and props.

## StaggeredText

`staggered-text/StaggeredText.tsx` provides character, word, and line reveals with optional blur, four movement directions, configurable stagger order, and scroll entrance/exit callbacks. See `staggered-text/README.md` for usage and props.

## ShatterText

`ShatterText` draws the headline as irregular triangular glass fragments. It assembles when first visible, shatters once automatically, then reassembles. Pointer movement opens local hairline cracks; clicking or pressing Enter/Space shatters the clicked area again. There is no repeating autoplay timer.

```tsx
import ShatterText from '@/components/global/ShatterText'

<ShatterText
  text="Shatter"
  className="h-[420px] rounded-3xl bg-neutral-950 text-white md:h-[560px]"
  accentColor="#7b5cff"
/>
```

Tailwind controls layout, sizing, typography, background, and focus feedback. The canvas follows the inherited font and text color; explicit `fontFamily`, `fontSize`, `fontWeight`, and `colors={[front, frontEnd]}` are optional. Text fits the available area; `\n` adds line breaks. `as` chooses the accessible heading level (default `h2`).

`shardSize`, `irregularity`, `crack`, `crackRadius`, `shatterRadius`, and `force` tune the glass. Radii and shard size are relative to the fitted font size. `introDuration` and `reassembleDuration` are seconds. Use `autoShatter={false}` for assembly only, `interactive={false}` to disable pointer interaction, or `paused` to pause motion. A ref exposes `shatter(x?, y?)` in local pixels and `assemble()`.

Framer Motion drives the timeline and cursor springs. Drawing stops when idle, paused, or offscreen. Device pixel ratio is capped at 1.5 and the fracture grid limits density. Reduced motion and canvas-unavailable browsers receive a normal DOM heading. Font loading and resize rebuild the glyph fragments; observers and animation controls are cleaned up on unmount.
