# BlurText

Import `BlurText` from `@/components/blur-text/BlurText`. The component uses the existing Framer Motion package, animates once when it enters the viewport, and shows static text for reduced motion or `disabled`.

Set `once={false}` for repeatable scroll reveals. Words fade and blur back out when they leave the configured viewport threshold, then reveal again on re-entry. Exit has no word-stagger delay. The homepage contact headline uses this mode; the hero keeps its default one-time reveal.

```tsx
<BlurText
  as="h2"
  text="Good work starts with a better question."
  delay={100}
  animateBy="words"
  direction="bottom"
  className="text-4xl"
  onAnimationComplete={handleAnimationComplete}
/>
```

`delay` is milliseconds between segments; `stepDuration` is seconds per animation step. Use `animationFrom`, `animationTo`, and `easing` to customize keyframes. `threshold` and `rootMargin` configure the viewport observer. The default element is `p`; `as` also accepts headings, `span`, and `div`. `renderSegment` can add styling inside a word without changing its animation. A visually hidden copy preserves continuous text for assistive technology, and animated segments are hidden from screen readers.
