# Bready - Design System

## Theme

Light only. Scene: someone baking at a sunlit kitchen bench, phone at arm's length, flour everywhere. Warm daylight surface, no dark mode.

## Color

Strategy: **Committed** - amber carries the whole surface (backgrounds, text, chips, buttons). This is the identity, keep it.

| Role | Value |
|------|-------|
| Surface | gradient amber-50 → orange-50 (fixed layer) |
| Card | white, border amber-100, shadow-md |
| Ink (headings) | amber-900 |
| Ink (body) | amber-800 / amber-700 |
| Muted | amber-600 / amber-500 |
| Primary action | amber-600 bg, white text; hover amber-700 |
| Success (step done) | green-500 / green-50 |
| Focus ring | 3px solid #f59e0b |

## Typography

- **Display**: "Fraunces Variable" (self-hosted via @fontsource-variable) - page titles, bread names, hero. Cookbook warmth. Never on labels, buttons, or data.
- **Body/UI**: system-ui stack. 16px base, 18px under 640px (kitchen readability).
- Utility: `font-display` (Tailwind v4 @theme token).

## Components

- Pills for nav/filters/mode buttons: rounded-full, amber-600 active, white + amber border inactive.
- Cards: rounded-xl/2xl, white, amber-100 border. No nested cards, no side-stripes.
- Step cards: tap-to-complete, green tint when done, inline timer bar when the step has a duration.
- Hearts (favourites): top-right overlay on imagery, filled rose-500 on white when active (a gold heart reads as un-toggled; red is the universal favourite signal).

## Motion

- Page transitions: 300ms fade+rise (Layout AnimatePresence).
- Micro: whileTap scale 0.95-0.98 on tappables; 150-250ms state transitions.
- Celebrations only at completion moments (flour-burst confetti, ~2s, skipped under prefers-reduced-motion).
- Ambient: FlourParticles background (disabled under prefers-reduced-motion).

## Sound

Tiny WebAudio synth cues (no assets): soft pop on step check, two-note chime on timer end, short fanfare on bake complete. Global mute toggle in nav, persisted (`bready:muted`). Volume low (~0.15 gain).

## Persistence keys (localStorage)

`bready:favs`, `bready:muted`, `bready:wakelock`, `bready:bakes`, `bready:steps:<recipeId>`, `bready:ings:<recipeId>`, `bready:timers:<recipeId>`, `bready:scale:<recipeId>`, `bready:baked:<recipeId>`.
