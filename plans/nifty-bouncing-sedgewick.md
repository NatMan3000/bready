# Bready - Bread Information PWA

## Overview

A visually rich Progressive Web App for browsing bread varieties and recipes. Personal/family use, installable on phones, works offline in the kitchen. Features playful interactive elements and smooth animations.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Runtime | Bun | Nathan's preference |
| Frontend | React + Vite | Fast dev, excellent PWA support |
| Styling | TailwindCSS v4 | Utility-first, matches other projects |
| Animation | Framer Motion | Smooth page transitions, micro-interactions |
| Creative | p5.js | Dough sim, particle effects, generative art |
| Icons | Lottie (free library) | Animated baking icons for recipe steps |
| PWA | vite-plugin-pwa | Zero-config service worker |
| Data | Local JSON | No backend needed for MVP |
| Images | AI-generated | Google Imagen/Nano for bread photos |
| Hosting | Cloudflare Pages | Free, fast, integrates with nathans-lab.fyi |

---

## MVP Features

### 1. Bread Encyclopedia
- Browse bread types by category (sourdough, flatbreads, enriched, etc.)
- Each bread entry includes:
  - Name, origin, description
  - Key characteristics (crust, crumb, flavor)
  - AI-generated bread photo
  - Difficulty rating

### 2. Recipe Collection
- Step-by-step instructions with Lottie animated icons
- Ingredients list with measurements
- Timer integration for proofing/baking
- Tips and common mistakes

### 3. PWA Capabilities
- Installable on iOS/Android
- Offline access (all data bundled)
- Kitchen-friendly UI (large buttons, readable fonts)

---

## Creative Features (The Fun Stuff)

### 1. Dough Kneading Simulator (p5.js)
**Location:** Home page hero or loading/empty states

**Behavior:**
- Soft-body physics blob that responds to touch/mouse
- Satisfying squish and bounce
- Shows "knead me!" prompt
- Fun interactive element that sets the playful tone

### 2. Flour Particle System (p5.js/Canvas)
**Location:** Background layer, subtle throughout app

**Behavior:**
- Gentle floating particles like flour dust
- React to scroll (parallax drift)
- React to mouse/touch (swirl away)
- Different density per page (heavier on recipe pages)

### 3. Framer Motion Animations
**Page Transitions:**
- Smooth fade/slide between pages
- Staggered card entrance on category pages
- Spring physics for natural feel

**Micro-interactions:**
- Cards lift on hover
- Buttons have satisfying press states
- Recipe steps reveal with scroll

### 4. Lottie Animated Icons
**Source:** LottieFiles.com (free library)

**Usage:**
- Mixing bowl animation for "mix ingredients" step
- Oven/heat animation for baking steps
- Timer animation for proofing
- Checkmark for completed steps

### 5. Generative Category Backgrounds (p5.js)
**Concept:** Each bread category has a unique procedural pattern
- **Sourdough:** Bubbly, organic circles (like crumb structure)
- **Flatbread:** Layered horizontal lines
- **Enriched:** Soft, pillowy gradient blobs
- **Quick bread:** Scattered, quick brush strokes
- **Artisan:** Geometric, crafted patterns

---

## Project Structure

```
Bready/
├── CLAUDE.md
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── index.html
├── public/
│   ├── icons/              # PWA icons
│   ├── lotties/            # Lottie JSON animations
│   └── images/             # AI-generated bread photos
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── BreadCard.tsx
│   │   ├── RecipeView.tsx
│   │   ├── CategoryFilter.tsx
│   │   └── LottieIcon.tsx
│   ├── creative/           # p5.js interactive elements
│   │   ├── DoughKneader.tsx
│   │   ├── FlourParticles.tsx
│   │   └── CategoryBackground.tsx
│   ├── data/
│   │   ├── breads.json
│   │   └── recipes.json
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── BreadDetail.tsx
│   │   └── RecipeDetail.tsx
│   └── types/
│       └── index.ts
└── plans/
```

---

## Implementation Steps

### Phase 1: Project Setup
1. Initialize Bun project with Vite React template
2. Add TailwindCSS v4
3. Add Framer Motion, p5.js (react-p5), lottie-react
4. Configure PWA plugin
5. Create CLAUDE.md

### Phase 2: Core Layout & Navigation
1. Create Layout with Framer Motion page transitions
2. Set up React Router with animated routes
3. Build basic navigation (home, categories, about)
4. Add FlourParticles background layer

### Phase 3: Creative Components
1. Build DoughKneader soft-body simulation
2. Create CategoryBackground generative patterns
3. Set up LottieIcon component with free animations
4. Integrate Framer Motion micro-interactions

### Phase 4: Data & Content
1. Create bread data JSON (10-15 varieties)
2. Create recipe data JSON (5-10 recipes)
3. Generate bread images with AI (separate step)
4. Download relevant Lottie animations from LottieFiles

### Phase 5: Pages & Features
1. Build Home page with DoughKneader hero
2. Build category browse with animated cards
3. Build BreadDetail with characteristics display
4. Build RecipeDetail with Lottie step icons

### Phase 6: PWA & Polish
1. Add PWA manifest and icons
2. Configure service worker for offline
3. Kitchen-friendly UI (large touch targets)
4. Test installation on mobile
5. Performance optimization (lazy load p5.js)

---

## Data Schema

### Bread Entry
```typescript
interface Bread {
  id: string
  name: string
  category: 'sourdough' | 'flatbread' | 'enriched' | 'quick' | 'artisan'
  origin: string
  description: string
  characteristics: {
    crust: string
    crumb: string
    flavor: string
  }
  difficulty: 1 | 2 | 3 | 4 | 5
  imageUrl?: string
}
```

### Recipe Entry
```typescript
interface Recipe {
  id: string
  breadId: string          // Links to bread entry
  prepTime: number         // minutes
  proofTime: number        // minutes
  bakeTime: number         // minutes
  ingredients: Ingredient[]
  steps: Step[]
  tips: string[]
}
```

---

## Verification

1. `bun run dev` - App runs locally
2. `bun run build` - Production build succeeds
3. **Creative elements work:**
   - DoughKneader responds to touch/mouse
   - Flour particles float and react to interaction
   - Page transitions are smooth
   - Lottie icons animate on recipe steps
4. Test PWA install on mobile device
5. Verify offline access works
6. Browse breads and recipes end-to-end
7. Performance check (no jank from p5.js)

---

## Future Enhancements (Post-MVP)

- [ ] Search functionality
- [ ] Favorites/bookmarks
- [ ] Personal notes on recipes
- [ ] Photo uploads for bakes
- [ ] Share recipes with family
- [ ] AI-generated bread suggestions based on ingredients

---

*Plan created: 2026-01-25*
