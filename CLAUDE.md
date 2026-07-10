# Bready - Bread Information PWA

| Field | Value |
|-------|-------|
| **Status** | Active |
| **Priority** | Medium |
| **Owner** | Nathan |
| **Category** | personal |
| **Task ID** | 90 |

---

## Quick Context

A visually rich Progressive Web App for browsing bread varieties and recipes. Personal/family use, installable on phones, works offline in the kitchen. Features playful interactive elements like a dough kneading simulator and flour particle effects.

---

## Project History

@TIMELINE.md
@memory/open-threads.md

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Frontend | React 19 + Vite 7 |
| Styling | TailwindCSS v4 |
| Animation | Framer Motion |
| Creative | p5.js |
| Icons | Lottie (lottie-react) |
| Routing | React Router v7 |
| PWA | vite-plugin-pwa |

---

## Design Context

`PRODUCT.md` (users, tone, principles) and `DESIGN.md` (palette, type, motion, sound, localStorage keys) at project root - read both before UI work.

## Creative Features

1. **Dough Kneading Simulator** - canvas soft-body blob on home page (knead/roll/cut/bake modes)
2. **Flour Particles** - subtle floating background particles (p5, lazy-loaded, disabled under reduced motion)
3. **Framer Motion** - page transitions, micro-interactions
4. **Lottie Icons** - animated icons for recipe steps (lazy-loaded, emoji fallback - no lottie JSONs shipped yet)
5. **Bake celebrations** - flour-burst confetti + WebAudio fanfare when all steps complete; global bake counter
6. **Sound cues** - tiny WebAudio synth (pop/chime/fanfare), mute toggle in nav, no audio assets

## Kitchen Features (2026-07-10)

- **Step timers** - per-step countdowns (wall-clock `endsAt`, survive reload), chime + vibration on finish, floating soonest-timer pill
- **Persistence** - step progress, ingredient check-offs, timers, scale, favourites all in localStorage (keys in DESIGN.md)
- **Recipe scaling** - ½× / 1× / 1½× / 2× with fraction-friendly formatting
- **Wake lock** - "Keep screen on" toggle on recipe pages
- **Favourites + search** - hearts on breads, favourites filter/sort, text search on Breads page
- **Bread of the Day** - date-seeded pick on Home + "Surprise me" random jump
- **Typography** - Fraunces Variable (self-hosted @fontsource) for headings via `font-display` utility

---

## Deployment

| Environment | URL |
|-------------|-----|
| **Production** | https://natman3000.github.io/bready/ |
| **Repository** | https://github.com/NatMan3000/bready |

Deployed via GitHub Actions on push to main.

---

## Commands

```bash
bun run dev      # Start dev server (http://localhost:5173)
bun run build    # Production build
bun run preview  # Preview production build
```

---

## Project Structure

```
src/
├── components/     # Reusable UI components
├── creative/       # p5.js interactive elements
├── data/           # JSON data for breads/recipes
├── pages/          # Route pages
└── types/          # TypeScript types
```

---

*Last updated: 2026-07-10*
