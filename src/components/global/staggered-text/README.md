# StaggeredText

Staggered text entrance built with the existing Framer Motion package and Tailwind utilities. Typography inherits the site's heading/body fonts. It animates once on entering the viewport by default.

```tsx
import StaggeredText from '@/components/global/staggered-text'

<StaggeredText
  as="h2"
  text="Build faster|than ever"
  separator="|"
  segmentBy="chars"
  direction="top"
  staggerDirection="forward"
  duration={1}
  delay={80}
  easing="anticipate"
  blur
  className="text-center text-5xl leading-tight md:text-7xl"
  onAnimationComplete={handleComplete}
/>
```

- `segmentBy`: `chars`, `words` (default), or `lines`. Character mode keeps words intact when wrapping and treats Unicode grapheme clusters as one character.
- `separator`: optional line delimiter; defaults to newlines. Whitespace and empty lines are preserved.
- `direction`: `top` (default), `bottom`, `left`, or `right`.
- `staggerDirection`: `forward`, `reverse`, or `center` (paired characters/words start together from the middle).
- `delay`: milliseconds between segments (default 80); `duration`: seconds per segment (default .6). `easing` accepts a Motion easing or a per-keyframe easing array.
- `blur`: default `true`. `from` and `to` accept Motion targets; `to` can be a keyframe snapshot array.
- `threshold` and `rootMargin`: intersection observer options, default `.1` and `0px`.
- `exitOnScrollOut`: default `false`. When enabled, leaving the viewport reverses the entrance and stagger order; re-entering plays it again. `onAnimationComplete` and `onExitComplete` fire once after the last segment completes.
- `respectReducedMotion`: default `true`; renders readable static text. `as`, `id`, `className`, and `style` control semantics and styling.

A visually hidden copy gives assistive technology the complete text, while animated fragments are hidden from screen readers. There are no timers or extra animation loops. Remount with a new React `key` to replay manually.
