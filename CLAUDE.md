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

## Creative Features

1. **Dough Kneading Simulator** - p5.js soft-body blob on home page
2. **Flour Particles** - Subtle floating background particles
3. **Framer Motion** - Page transitions, micro-interactions
4. **Lottie Icons** - Animated icons for recipe steps
5. **Generative Backgrounds** - Unique pattern per bread category

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

## Timeline

| Date | Event |
|------|-------|
| 2026-01-25 | Project created, Phase 1 setup complete |
| 2026-01-25 | Deployed to GitHub Pages, flour particles refined |

---

*Last updated: 2026-01-25*
