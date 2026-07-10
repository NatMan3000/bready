---
type: auto
session_id: ae38566b-a713-44e1-8ab8-6ee52bd5c4cb
project: Bready
date: 2026-07-10
topic: Kitchen upgrade (timers, scaling, celebrations) + dough baking game
duration: 2 hours
events: 164
---

# Bready - Kitchen upgrade + dough baking game

**Project:** Bready (React 19 + Vite 7 + Tailwind v4 kitchen PWA)
**Purpose:** Take the family bread app "to the next level" - richer kitchen UX, delight, visual polish - then turn the homepage dough toy into a real game.
**Duration:** 2 hours
**Participants:** Nathan, Kai (running on Fable 5)
**Session Restart ID:** `claude -r ae38566b-a713-44e1-8ab8-6ee52bd5c4cb`

## Summary

Nathan pointed Kai at the live GitHub Pages app (https://natman3000.github.io/bready/) and asked to make it amazing. Kai ran the `impeccable` design skill to establish PRODUCT.md + DESIGN.md context, then built a full kitchen-UX layer (persisted step timers, recipe scaling, check-offs, favourites, search, bake celebrations, WebAudio sound, Fraunces display type) - fanning the three page rewrites out to opus engineers. A second prompt turned the basic homepage dough kneader into a proper bake-to-perfect-or-char game with a face and a persistent bakery shelf. Two commits shipped and deployed clean.

## What We Did

1. **Established design context** - ran `impeccable`, wrote `PRODUCT.md` (users, brand, tone) and `DESIGN.md` (palette, typography, motion, sound, localStorage keys) so future design work is grounded.
2. **Built the kitchen module set** - `useStepTimers` (wall-clock persisted timers), `useLocalStorage`, `useFavorites`, `useWakeLock` hooks; `StepTimer`, `Celebration`, `FavoriteButton` components; `sound.ts` (WebAudio cues, no assets) and `scale.ts` (fraction-friendly recipe scaling).
3. **Rewrote the three discovery pages + RecipeDetail** via three parallel opus engineers (see Related Sessions) - Bread of the Day, Surprise Me, search, favourites hearts, and the full timers/scaling/check-off/celebration flow on the recipe page.
4. **Added polish + a11y** - Fraunces Variable self-hosted display type, burnt-toast 404 page, prefers-reduced-motion support, and lazy-loaded p5/lottie (main chunk 542KB to 137KB gzip).
5. **Fixed broken CLAUDE.md imports** - created the missing `TIMELINE.md` and `memory/open-threads.md`, gitignored the memory junction.
6. **Fixed the deploy remote** - the local clone pushed only to Forgejo while GitHub Pages deploys from the GitHub mirror; added dual push URLs so pushes actually deploy.
7. **Leveled up the dough game** - one opus engineer turned `DoughKneader.tsx` into a game: dough buddy face (eye tracking, blinks, panic while baking), knead meter, bake arc (ding at perfect, smokes and chars if overbaked), result judging (Boule/Baguette/Rolls/Brick/Charcoal), and a persistent Josh's Bakery shelf.
8. **Verified in-browser + shipped** - drove timers, favourites, 404, and the full game loop via chrome-devtools, then committed and pushed both changes (auto-deployed to Pages).

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Page rewrites went to opus engineers, not inline | Nathan nudged toward subagents; three page rewrites are parallel scoped work. Kai noted it should have been the shape from the first file. |
| Wall-clock `endsAt` timers (not tick counts) | Survive reloads and hours away; expired-while-away timers restore as done silently instead of chiming late. |
| Lazy-load p5 + lottie out of the main chunk | Decorative libs never belong in a PWA's critical path (542KB to 137KB gzip). |
| Dual push URLs (Forgejo + GitHub) | Pages deploys from the GitHub mirror; Forgejo-only push never deployed. |

## Files Created

| File | Description |
|------|-------------|
| `PRODUCT.md` | Design context: users, brand, tone (impeccable anchor) |
| `DESIGN.md` | Design system: palette, typography, motion, sound, localStorage keys |
| `TIMELINE.md` | Project timeline (fixes broken CLAUDE.md import) |
| `src/lib/sound.ts` | WebAudio sound cues (pop/chime/fanfare), no assets |
| `src/lib/scale.ts` | Recipe scaling with fraction-friendly amounts |
| `src/hooks/useLocalStorage.ts`, `useFavorites.ts`, `useWakeLock.ts`, `useStepTimers.ts` | Persistence, favourites, wake lock, timer hooks |
| `src/components/StepTimer.tsx`, `Celebration.tsx`, `FavoriteButton.tsx` | Timer UI, flour-confetti canvas, heart button |
| `src/pages/NotFound.tsx` | Burnt-toast 404 |
| `FILE-INDEX.md` | Project artifact index |

## Files Modified

| File | Change |
|------|--------|
| `src/pages/RecipeDetail.tsx`, `Home.tsx`, `Breads.tsx`, `Recipes.tsx` | Kitchen + discovery upgrades (via engineers) |
| `src/creative/DoughKneader.tsx` | Turned into the bread-making game |
| `src/components/Layout.tsx` | Nav mute toggle, bake counter glue |
| `index.html`, `CLAUDE.md`, `.gitignore` | Meta tag fix, context notes, memory junction ignore |

## Next Steps

- ⬜ Route the pre-existing lint errors (`Celebration.tsx` ref-during-render; `DoughKneader.tsx` immutability) - a full-project `eslint src` currently exits 1.
- ⬜ Josh QA: first to bake the Charcoal on purpose wins.

## Related Sessions

- [2026-07-10 RecipeDetail engineer rewrite](2026-07-10-recipedetail-engineer.md) - the `recipe-detail` teammate (session `b0f64777`)
- [2026-07-10 discovery pages engineer](2026-07-10-discovery-pages-engineer.md) - the `discovery-pages` teammate (session `98bb6d9f`)
- [2026-01-25 initial build](2026-01-25.md)
