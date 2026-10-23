# VaporText

Rotating words condense from fine particles, hold as crisp lettering, then dissolve into colored wisps. The effect samples the actual glyph pixels rather than fading a text layer. Framer Motion drives the timeline; Tailwind styles the element. All implementation files stay in this folder.

```tsx
import VaporText from '@/components/global/vapor-text'

{/*<VaporText
  as="span"
  words={["Good", "work", "starts"]}
  className="font-heading text-5xl font-bold normal-case leading-tight md:text-[112px]"
  preset="frost"
  color="#FFFFFF"
  vaporColor="#FF0000"
  sweep="scatter"
  align="center"
  density={1}
  particleSize={1}
  spread={1}
  rise={0.6}
  turbulence={0.6}
  diffusion={0.2}
  grain={1}
  stagger={0.8}
  condense={2}
  hold={2.4}
  dissolve={1.5}
  overlap={0.6}
  breath={1}
  breathRadius={0.8}
  recovery={1.2}
  area="parent"
  loop={true}
  startOnView={true}
  interactive={true}
  clickAdvance={true}
  pauseOnHover={true}
  paused={false}
/>*/}
```

Typography inherits the existing page font, size, weight, and line height. The longest phrase reserves layout width; `align` is `start`, `center` (default), or `end`. Newlines support short multiline phrases. `color` defaults to `currentColor`. Preset vapor colors can be overridden with `vaporColor`, including `currentColor`.

`preset` accepts the six profiles demonstrated in the reference video. The default is `mist`; individual props override preset values. Changing a preset restarts the cycle.

| Preset | Vapor Color | Sweep | Motion |
| --- | --- | --- | --- |
| `ink` | `#FFFFFF` | Left | Tight white curling plume |
| `mist` | `#B19EEF` | Left | Soft violet vapor rising and curling sideways |
| `steam` | `#E8E3FF` | Top | Strong rising columns, condensing from below |
| `dust` | `#A3A3A3` | Scatter | Grain clusters scattering in all directions |
| `bloom` | `#FF9FFC` | Center | Two pink plumes opening outward |
| `frost` | `#9FD8FF` | Right | Blue vapor drifting sideways and sinking |

`vaporTextPresets` exports the captured settings and `VaporPreset` types the preset names. Particle trajectories are precomputed through a coherent curl field; the presets change spread, rise, turbulence, diffusion, size, and emission order, as well as color.

`condense`, `hold`, and `dissolve` are seconds, defaulting to 2, 2.4, and 1.5. `overlap` defaults to .6: the next word starts condensing after 40% of the outgoing dissolve and continues from that progress when the old word disappears. Set `overlap={0}` to use sequential transitions with `gap` (default .2 seconds). `loop` defaults to true; false leaves the last word visible. `startOnView` starts when visible by default. `paused` freezes the current timeline. `onWordChange(index)` fires once when a word starts condensing, including during overlap; a ref exposes `next()` and `replay()`.

`sweep` accepts `left`, `right`, `center`, `top`, or `scatter`; `stagger` controls sweep separation. `density`, `particleSize`, `spread`, `rise`, `turbulence`, `diffusion`, and `grain` tune the particle field. Negative `rise` lets the vapor sink.

Mouse motion blows nearby letters into vapor. `interactive`, `breath`, `breathRadius` (in font-size units), and `recovery` (seconds) tune interaction. `area` selects `parent` (default), `self`, or `window`. Touch scrolling remains native. `pauseOnHover` pauses the hold while the pointer rests over the word. `clickAdvance` enables click and Enter/Space advancement.

Reduced motion and canvas-unavailable browsers show the first phrase as normal text. Preference changes are subscribed to at runtime. Assistive technology receives the first phrase without repeated live announcements. Font loading and resizing rebuild glyph samples; DPR is capped at 2, with fewer particles on compact screens. Glyph bitmaps store only the lettering area rather than the whole vapor surface. Idle, hidden, and offscreen instances skip canvas drawing. Animation controls, event listeners, and observers are cleaned up on unmount.
