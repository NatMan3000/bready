import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { playDing, playFanfare, playPop, playSquish } from '../lib/sound'

// A tiny bread-making game on a wooden board.
//
// Knead the dough (it has opinions), roll it, cut it, bake it - then get it out
// of the oven before it turns to charcoal. What comes out depends on what you
// did to it. Everything you bake lands on the shelf.
//
// Performance shape: all fast-moving state lives in a single mutable `Sim` ref
// driven by one rAF loop. React state only holds what the DOM needs (mode,
// phase, result, and a UI snapshot synced at ~11Hz), so a baking loaf does not
// re-render the component 20 times a second.

interface Point {
  x: number
  y: number
  vx: number
  vy: number
}

interface DoughPiece {
  points: Point[]
  cx: number
  cy: number
  radius: number
}

/** kind: 0 = flour poof, 1 = steam wisp, 2 = smoke */
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  kind: number
}

type DoughMode = 'knead' | 'roll' | 'cut' | 'bake'
type Phase = 'play' | 'baking' | 'result'
type ResultType = 'boule' | 'baguette' | 'rolls' | 'brick' | 'charcoal'
type Expr = 'idle' | 'squeeze' | 'worried' | 'happy' | 'flat' | 'dead'

interface UiSnapshot {
  knead: number
  bake: number
  pieces: number
  roll: number
}

interface Sim {
  size: number
  base: number
  doughs: DoughPiece[]
  particles: Particle[]
  mouse: { x: number; y: number; pressed: boolean; hover: boolean }
  mode: DoughMode
  phase: Phase
  result: ResultType | null
  knead: number
  roll: number
  bake: number
  cuts: number
  pop: number
  blinkIn: number
  blinkFor: number
  eyeX: number
  eyeY: number
  time: number
  lastTs: number
  flourCd: number
  squishCd: number
  puffCd: number
  uiCd: number
  dinged: boolean
  reduced: boolean
  ui: UiSnapshot
}

interface DoughKneaderProps {
  size?: number
  className?: string
}

const NUM_POINTS = 16
const MAX_PIECES = 20
const POOL = 40
const KNEAD_RATE = 22 // percent per second of active kneading (~4.5s to develop)
const ROLL_RATE = 0.55 // roll progress per second
const BAKE_RATE = 20 // percent per second (~5s to perfect)
const BAKE_MAX = 160
const BURNT_AT = 130
const KNEAD_FLOOR = 30 // below this at bake time and you get a brick
const BAKERY_KEY = 'bready:bakery'
const BAKERY_CAP = 200

const modeConfig: Record<DoughMode, { emoji: string; label: string }> = {
  knead: { emoji: '🤲', label: 'Knead' },
  roll: { emoji: '🪨', label: 'Roll' },
  cut: { emoji: '🔪', label: 'Cut' },
  bake: { emoji: '🔥', label: 'Bake' },
}

const RESULTS: Record<ResultType, { label: string; emoji: string; caption: string }> = {
  boule: { label: 'Boule', emoji: '🍞', caption: 'Perfect Boule!' },
  baguette: { label: 'Baguette', emoji: '🥖', caption: 'Magnifique. A baguette.' },
  rolls: { label: 'Dinner Rolls', emoji: '🥐', caption: 'Dinner rolls! One each.' },
  brick: { label: 'Dense Brick', emoji: '🧱', caption: 'A brick. You forgot to knead it.' },
  charcoal: { label: 'Charcoal', emoji: '⬛', caption: 'Extra crunchy. Nobody saw that.' },
}

const SHELF_ORDER: ResultType[] = ['boule', 'baguette', 'rolls', 'brick', 'charcoal']

const freshUi = (): UiSnapshot => ({ knead: 0, bake: 0, pieces: 1, roll: 0 })

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

type RGB = [number, number, number]

const RAW: RGB[] = [
  [254, 243, 199],
  [253, 230, 138],
  [252, 211, 77],
]
// Well-developed dough is smoother and a touch paler.
const DEVELOPED: RGB[] = [
  [255, 251, 235],
  [254, 243, 199],
  [253, 230, 138],
]
const BAKED: RGB[] = [
  [245, 158, 11],
  [217, 119, 6],
  [180, 83, 9],
]
const CHARCOAL: RGB = [61, 43, 31] // #3d2b1f
const NEAR_BLACK: RGB = [20, 14, 11]
const INK_DARK: RGB = [74, 44, 20]
const INK_LIGHT: RGB = [248, 231, 200]

// Scratch buffers so the per-frame colour maths allocates nothing.
const SCRATCH: RGB[] = [
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
]
const INK_SCRATCH: RGB = [0, 0, 0]

function mixInto(out: RGB, a: RGB, b: RGB, t: number) {
  out[0] = a[0] + (b[0] - a[0]) * t
  out[1] = a[1] + (b[1] - a[1]) * t
  out[2] = a[2] + (b[2] - a[2]) * t
}

function css(c: RGB): string {
  return `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

// ---------------------------------------------------------------------------
// Sim
// ---------------------------------------------------------------------------

function makeDough(cx: number, cy: number, radius: number): DoughPiece {
  const points: Point[] = []
  for (let i = 0; i < NUM_POINTS; i++) {
    const angle = (i / NUM_POINTS) * Math.PI * 2
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    })
  }
  return { points, cx, cy, radius }
}

function prefersReduced(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function createSim(size: number): Sim {
  const base = size * 0.25
  const particles: Particle[] = []
  for (let i = 0; i < POOL; i++) {
    particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1, kind: 0 })
  }
  return {
    size,
    base,
    doughs: [makeDough(size / 2, size / 2, base)],
    particles,
    mouse: { x: size / 2, y: size / 2, pressed: false, hover: false },
    mode: 'knead',
    phase: 'play',
    result: null,
    knead: 0,
    roll: 0,
    bake: 0,
    cuts: 0,
    pop: -1,
    blinkIn: 3 + Math.random() * 3,
    blinkFor: 0,
    eyeX: 0,
    eyeY: 0,
    time: 0,
    lastTs: 0,
    flourCd: 0,
    squishCd: 0,
    puffCd: 0,
    uiCd: 0,
    dinged: false,
    reduced: prefersReduced(),
    ui: { knead: 0, bake: 0, pieces: 1, roll: 0 },
  }
}

function resetSim(sim: Sim, size: number) {
  sim.size = size
  sim.base = size * 0.25
  sim.doughs = [makeDough(size / 2, size / 2, sim.base)]
  sim.mode = 'knead'
  sim.phase = 'play'
  sim.result = null
  sim.knead = 0
  sim.roll = 0
  sim.bake = 0
  sim.cuts = 0
  sim.pop = -1
  sim.dinged = false
  sim.eyeX = 0
  sim.eyeY = 0
  sim.mouse.pressed = false
  sim.reduced = prefersReduced()
  for (const p of sim.particles) p.life = 0
}

/** The biggest piece wears the face. */
function mainDough(sim: Sim): DoughPiece {
  let best = sim.doughs[0]
  for (const d of sim.doughs) if (d.radius > best.radius) best = d
  return best
}

function spawn(sim: Sim, kind: number, x: number, y: number) {
  if (sim.reduced) return
  for (const p of sim.particles) {
    if (p.life > 0) continue
    p.kind = kind
    p.x = x
    p.y = y
    if (kind === 0) {
      p.vx = (Math.random() - 0.5) * 44
      p.vy = -(18 + Math.random() * 42)
      p.max = 0.5 + Math.random() * 0.3
      p.size = 1.6 + Math.random() * 2.2
    } else if (kind === 1) {
      p.vx = (Math.random() - 0.5) * 10
      p.vy = -(16 + Math.random() * 14)
      p.max = 1.1 + Math.random() * 0.5
      p.size = 2.6 + Math.random() * 2
    } else {
      p.vx = (Math.random() - 0.5) * 22
      p.vy = -(42 + Math.random() * 26)
      p.max = 0.9 + Math.random() * 0.5
      p.size = 3 + Math.random() * 3
    }
    p.life = p.max
    return
  }
}

/** Returns true if a split actually happened. */
function splitAt(sim: Sim, tapX: number, tapY: number): boolean {
  const doughs = sim.doughs
  if (doughs.length >= MAX_PIECES) return false

  let tappedIdx = -1
  for (let i = 0; i < doughs.length; i++) {
    const d = doughs[i]
    const dx = tapX - d.cx
    const dy = tapY - d.cy
    if (Math.sqrt(dx * dx + dy * dy) < d.radius * 1.5) {
      tappedIdx = i
      break
    }
  }
  if (tappedIdx === -1) return false

  const tapped = doughs[tappedIdx]
  const newRadius = tapped.radius * 0.75
  const offset = 15 + newRadius * 0.5
  const isVerticalCut = sim.cuts % 2 === 1

  let dough1: DoughPiece
  let dough2: DoughPiece

  if (isVerticalCut) {
    dough1 = makeDough(tapped.cx, tapped.cy - offset, newRadius)
    dough2 = makeDough(tapped.cx, tapped.cy + offset, newRadius)
    dough1.points.forEach((p) => { p.vy = -2.5 })
    dough2.points.forEach((p) => { p.vy = 2.5 })
  } else {
    dough1 = makeDough(tapped.cx - offset, tapped.cy, newRadius)
    dough2 = makeDough(tapped.cx + offset, tapped.cy, newRadius)
    dough1.points.forEach((p) => { p.vx = -2.5 })
    dough2.points.forEach((p) => { p.vx = 2.5 })
  }

  sim.cuts++
  doughs.splice(tappedIdx, 1, dough1, dough2)
  return true
}

/** What did you just pull out of the oven? Order matters: burnt beats everything. */
function judge(sim: Sim): ResultType {
  if (sim.bake > BURNT_AT) return 'charcoal'
  if (sim.doughs.length > 1) return 'rolls'
  if (sim.roll > 0.6) return 'baguette'
  if (sim.knead < KNEAD_FLOOR) return 'brick'
  return 'boule'
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

function update(sim: Sim, dt: number) {
  const { mouse, size } = sim
  sim.time += dt
  sim.flourCd -= dt
  sim.squishCd -= dt
  sim.puffCd -= dt

  // Blinking - only ever on the open-eyed expressions, handled at draw time.
  sim.blinkFor -= dt
  sim.blinkIn -= dt
  if (sim.blinkIn <= 0) {
    sim.blinkFor = 0.15
    sim.blinkIn = 3 + Math.random() * 3
  }

  if (sim.pop >= 0) sim.pop += dt

  const kneading = sim.phase === 'play' && sim.mode === 'knead' && mouse.pressed
  const rolling = sim.phase === 'play' && sim.mode === 'roll' && mouse.pressed

  if (kneading) {
    sim.knead = Math.min(100, sim.knead + KNEAD_RATE * dt)
    if (sim.squishCd <= 0) {
      playSquish()
      sim.squishCd = 0.15
    }
    if (sim.flourCd <= 0) {
      const n = 3 + Math.floor(Math.random() * 3)
      for (let i = 0; i < n; i++) {
        spawn(sim, 0, mouse.x + (Math.random() - 0.5) * 18, mouse.y + (Math.random() - 0.5) * 12)
      }
      sim.flourCd = 0.12
    }
  }

  if (rolling) sim.roll = Math.min(1, sim.roll + ROLL_RATE * dt)

  if (sim.phase === 'baking') {
    sim.bake = Math.min(BAKE_MAX, sim.bake + BAKE_RATE * dt)
    if (!sim.dinged && sim.bake >= 100) {
      sim.dinged = true
      playDing()
    }
    const main = mainDough(sim)
    if (sim.bake > 100) {
      if (sim.puffCd <= 0) {
        spawn(sim, 2, main.cx + (Math.random() - 0.5) * main.radius, main.cy - main.radius * 0.8)
        sim.puffCd = 0.11
      }
    } else if (sim.bake >= 20) {
      if (sim.puffCd <= 0) {
        spawn(sim, 1, main.cx + (Math.random() - 0.5) * main.radius * 0.7, main.cy - main.radius * 0.75)
        sim.puffCd = 0.18
      }
    }
  }

  // Eyes drift toward the pointer, clamped to a few px so it stays subtle.
  const main = mainDough(sim)
  const targetX = mouse.hover ? clamp((mouse.x - main.cx) / (size * 0.35), -1, 1) * 3 : 0
  const targetY = mouse.hover ? clamp((mouse.y - main.cy) / (size * 0.35), -1, 1) * 2.4 : 0
  sim.eyeX += (targetX - sim.eyeX) * 0.12
  sim.eyeY += (targetY - sim.eyeY) * 0.12

  // Particles
  for (const p of sim.particles) {
    if (p.life <= 0) continue
    p.life -= dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.kind === 0) p.vy += 70 * dt // flour settles back down
    if (p.kind === 1) p.x += Math.sin((p.max - p.life) * 5) * 0.4
  }

  // ---- Soft-body physics (frame-based, as originally tuned) ----
  const k = sim.knead / 100
  const damping = 0.92 + 0.035 * k // developed dough wobbles less
  const stiffness = 0.3 + 0.12 * k
  const mouseRadius = 60
  const mouseForce = 0.35
  const returnForce = 0.04

  const over = clamp((sim.bake - 100) / 60, 0, 1)
  const baking = sim.phase === 'baking' || sim.phase === 'result'

  // Roll shape persists once rolled - a sausage stays a sausage.
  const xStretch = 1 + sim.roll * 1.2
  const yStretch = 1 - sim.roll * 0.5

  for (const dough of sim.doughs) {
    const { points, cx: doughCx, cy: doughCy, radius } = dough

    const bakeExpand = baking && sim.bake > 20
      ? (1 + ((Math.min(sim.bake, 100) - 20) / 80) * 0.2) * (1 - over * 0.06)
      : 1
    const effectiveRadius = radius * bakeExpand

    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      const angle = (i / NUM_POINTS) * Math.PI * 2

      const restX = doughCx + Math.cos(angle) * effectiveRadius * xStretch
      const restY = doughCy + Math.sin(angle) * effectiveRadius * yStretch

      point.vx += (restX - point.x) * returnForce
      point.vy += (restY - point.y) * returnForce

      if (mouse.pressed && sim.phase === 'play' && (sim.mode === 'knead' || sim.mode === 'roll')) {
        const dx = point.x - mouse.x
        const dy = point.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < mouseRadius && dist > 0) {
          const force = ((mouseRadius - dist) / mouseRadius) * mouseForce
          if (sim.mode === 'knead') {
            point.vx += (mouse.x - point.x) * force * 0.25
            point.vy += (mouse.y - point.y) * force * 0.25
          } else {
            point.vx += (point.x > doughCx ? 1 : -1) * force * 2
          }
        }
      }

      // Anxious tremble once it is past perfect.
      if (over > 0 && !sim.reduced) {
        point.vx += (Math.random() - 0.5) * 0.7 * over
        point.vy += (Math.random() - 0.5) * 0.7 * over
      }

      point.x += point.vx
      point.y += point.vy
      point.vx *= damping
      point.vy *= damping
    }

    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < NUM_POINTS; i++) {
        const next = (i + 1) % NUM_POINTS
        const p1 = points[i]
        const p2 = points[next]

        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const avgStretch = (xStretch + yStretch) / 2
        const targetDist = (2 * Math.PI * effectiveRadius * avgStretch) / NUM_POINTS

        if (dist > 0) {
          const diff = ((dist - targetDist) / dist) * stiffness
          const offsetX = dx * diff * 0.5
          const offsetY = dy * diff * 0.5
          p1.x += offsetX
          p1.y += offsetY
          p2.x -= offsetX
          p2.y -= offsetY
        }
      }

      for (const point of points) {
        point.x = Math.max(8, Math.min(size - 8, point.x))
        point.y = Math.max(8, Math.min(size - 8, point.y))
      }
    }

    let sx = 0
    let sy = 0
    for (const p of points) {
      sx += p.x
      sy += p.y
    }
    dough.cx = sx / NUM_POINTS
    dough.cy = sy / NUM_POINTS
  }
}

// ---------------------------------------------------------------------------
// Draw
// ---------------------------------------------------------------------------

function renderBoard(size: number, dpr: number): HTMLCanvasElement | null {
  const c = document.createElement('canvas')
  c.width = size * dpr
  c.height = size * dpr
  const ctx = c.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const boardGradient = ctx.createLinearGradient(0, 0, size, size)
  boardGradient.addColorStop(0, '#deb887')
  boardGradient.addColorStop(0.3, '#d2a679')
  boardGradient.addColorStop(0.6, '#c9976b')
  boardGradient.addColorStop(1, '#bc8b5e')
  ctx.fillStyle = boardGradient
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = 'rgba(139, 90, 43, 0.15)'
  ctx.lineWidth = 1
  for (let i = 0; i < size; i += 12) {
    ctx.beginPath()
    ctx.moveTo(0, i + Math.sin(i * 0.1) * 3)
    ctx.lineTo(size, i + Math.sin(i * 0.1 + 2) * 3)
    ctx.stroke()
  }

  ctx.strokeStyle = '#835a35'
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, size - 3, size - 3)
  return c
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, expr: Expr, blinking: boolean, left: boolean) {
  if (blinking && (expr === 'idle' || expr === 'worried')) {
    line(ctx, x - r, y, x + r, y)
    return
  }

  if (expr === 'squeeze') {
    // Scrunched shut: > <
    const dir = left ? 1 : -1
    ctx.beginPath()
    ctx.moveTo(x - r * 0.6 * dir, y - r)
    ctx.lineTo(x + r * 0.5 * dir, y)
    ctx.lineTo(x - r * 0.6 * dir, y + r)
    ctx.stroke()
    return
  }

  if (expr === 'happy') {
    ctx.beginPath()
    ctx.moveTo(x - r, y + r * 0.45)
    ctx.lineTo(x, y - r * 0.5)
    ctx.lineTo(x + r, y + r * 0.45)
    ctx.stroke()
    return
  }

  if (expr === 'dead') {
    const s = r * 0.9
    line(ctx, x - s, y - s, x + s, y + s)
    line(ctx, x + s, y - s, x - s, y + s)
    return
  }

  if (expr === 'flat') {
    ctx.beginPath()
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  ctx.beginPath()
  ctx.arc(x, y, r * (expr === 'worried' ? 1.08 : 1), 0, Math.PI * 2)
  ctx.fill()
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  d: DoughPiece,
  expr: Expr,
  ink: string,
  worry: number,
  ex: number,
  ey: number,
  blinking: boolean,
  sweat: boolean,
  time: number,
) {
  const r = d.radius
  const eyeGap = r * 0.34
  const eyeY = d.cy - r * 0.18 + ey
  const eyeR = Math.max(1.8, r * 0.11)
  const mouthY = d.cy + r * 0.22

  ctx.save()
  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.lineWidth = Math.max(1.6, r * 0.07)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  drawEye(ctx, d.cx - eyeGap + ex, eyeY, eyeR, expr, blinking, true)
  drawEye(ctx, d.cx + eyeGap + ex, eyeY, eyeR, expr, blinking, false)

  if (expr === 'squeeze') {
    ctx.beginPath()
    ctx.arc(d.cx, mouthY, r * 0.09, 0, Math.PI * 2)
    ctx.stroke()
  } else if (expr === 'worried') {
    ctx.beginPath()
    ctx.ellipse(d.cx, mouthY, r * 0.09, r * 0.05 + worry * r * 0.07, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else if (expr === 'happy') {
    ctx.beginPath()
    ctx.arc(d.cx, mouthY - r * 0.12, r * 0.22, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
  } else if (expr === 'dead' || expr === 'flat') {
    line(ctx, d.cx - r * 0.14, mouthY, d.cx + r * 0.14, mouthY)
  } else {
    ctx.beginPath()
    ctx.arc(d.cx, mouthY - r * 0.08, r * 0.15, 0.2 * Math.PI, 0.8 * Math.PI)
    ctx.stroke()
  }

  if (sweat) {
    const sx = d.cx + r * 0.52
    const sy = d.cy - r * 0.3 + Math.sin(time * 4) * r * 0.03
    ctx.fillStyle = 'rgba(125, 211, 252, 0.95)'
    ctx.beginPath()
    ctx.ellipse(sx, sy, r * 0.05, r * 0.075, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.beginPath()
    ctx.arc(sx - r * 0.015, sy - r * 0.02, r * 0.015, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

function expressionFor(sim: Sim): Expr {
  if (sim.phase === 'result') {
    if (sim.result === 'charcoal') return 'dead'
    if (sim.result === 'brick') return 'flat'
    return 'happy'
  }
  if (sim.phase === 'baking') return sim.bake > BURNT_AT ? 'dead' : 'worried'
  if (sim.mouse.pressed && (sim.mode === 'knead' || sim.mode === 'roll')) return 'squeeze'
  return 'idle'
}

function render(ctx: CanvasRenderingContext2D, sim: Sim, board: HTMLCanvasElement | null) {
  const { size } = sim

  if (board) ctx.drawImage(board, 0, 0, size, size)
  else ctx.clearRect(0, 0, size, size)

  const k = sim.knead / 100
  const bakeT = Math.min(sim.bake, 100) / 100
  const over = clamp((sim.bake - 100) / 60, 0, 1)
  const baking = sim.phase === 'baking' || sim.phase === 'result'

  // Three dough stops: raw -> developed -> baked -> charcoal -> near black.
  for (let i = 0; i < 3; i++) {
    mixInto(SCRATCH[i], RAW[i], DEVELOPED[i], k * 0.55)
    if (baking) {
      mixInto(SCRATCH[i], SCRATCH[i], BAKED[i], bakeT * (0.7 + i * 0.1))
      if (over > 0) {
        mixInto(SCRATCH[i], SCRATCH[i], CHARCOAL, Math.min(1, over * 2))
        if (over > 0.5) mixInto(SCRATCH[i], SCRATCH[i], NEAR_BLACK, (over - 0.5) * 2)
      }
    }
  }
  const color1 = css(SCRATCH[0])
  const color2 = css(SCRATCH[1])
  const color3 = css(SCRATCH[2])

  const darkness = bakeT * 0.45 + over * 0.55
  mixInto(INK_SCRATCH, INK_DARK, INK_LIGHT, clamp((darkness - 0.5) / 0.35, 0, 1))
  const ink = css(INK_SCRATCH)

  const popScale = sim.pop >= 0 && sim.pop < 0.5 && !sim.reduced
    ? 1 + 0.18 * Math.sin((sim.pop / 0.5) * Math.PI)
    : 1

  const main = mainDough(sim)
  const expr = expressionFor(sim)
  const blinking = sim.blinkFor > 0

  for (const dough of sim.doughs) {
    const { points, cx, cy, radius } = dough

    ctx.save()
    if (popScale !== 1) {
      ctx.translate(cx, cy)
      ctx.scale(popScale, popScale)
      ctx.translate(-cx, -cy)
    }

    // Shadow
    ctx.beginPath()
    ctx.moveTo(points[0].x + 3, points[0].y + 4)
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      ctx.quadraticCurveTo(prev.x + 3, prev.y + 4, (prev.x + curr.x) / 2 + 3, (prev.y + curr.y) / 2 + 4)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
    ctx.fill()

    // Body
    const gradient = ctx.createRadialGradient(cx - 10, cy - 10, 0, cx, cy, radius * 2)
    gradient.addColorStop(0, color1)
    gradient.addColorStop(0.5, color2)
    gradient.addColorStop(1, color3)

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2)
    }
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    if (baking && bakeT > 0.5) {
      ctx.strokeStyle = over > 0
        ? `rgba(18, 12, 10, ${0.4 + over * 0.4})`
        : `rgba(139, 69, 19, ${((bakeT - 0.5) / 0.5) * 0.4})`
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Highlight
    ctx.beginPath()
    ctx.ellipse(cx - 8, cy - 8, 8 * (radius / sim.base), 5 * (radius / sim.base), -0.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${baking ? 0.2 * (1 - over) : 0.4})`
    ctx.fill()

    if (dough === main) {
      drawFace(ctx, dough, expr, ink, clamp(sim.bake / BURNT_AT, 0, 1), sim.eyeX, sim.eyeY, blinking, sim.phase === 'baking' && sim.bake > 60, sim.time)
    }

    ctx.restore()
  }

  // Particles ride above the loaf.
  for (const p of sim.particles) {
    if (p.life <= 0) continue
    const a = p.life / p.max
    const grow = 1 + (1 - a) * 0.9
    if (p.kind === 0) ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.85})`
    else if (p.kind === 1) ctx.fillStyle = `rgba(255, 253, 245, ${a * 0.5})`
    else ctx.fillStyle = `rgba(96, 92, 90, ${a * 0.55})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * grow, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DoughKneader({ size = 200, className = '' }: DoughKneaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef(0)

  const simRef = useRef<Sim | null>(null)

  const [mode, setMode] = useState<DoughMode>('knead')
  const [phase, setPhase] = useState<Phase>('play')
  const [result, setResult] = useState<ResultType | null>(null)
  const [ui, setUi] = useState<UiSnapshot>(freshUi)
  const [bakery, setBakery] = useLocalStorage<ResultType[]>(BAKERY_KEY, [])

  // A fresh board means a fresh ball of dough. Adjusting state during render is
  // React's prescribed way to reset on a prop change - an effect here would
  // cascade an extra render. The sim itself is reset in the effect below, where
  // touching a ref is legal.
  const [lastSize, setLastSize] = useState(size)
  if (lastSize !== size) {
    setLastSize(size)
    setMode('knead')
    setPhase('play')
    setResult(null)
    setUi(freshUi)
  }

  // Canvas sizing, the static board, and the dough itself. Runs before the loop
  // effect below, so the sim always exists by the time a frame is drawn.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    boardRef.current = renderBoard(size, dpr)

    if (!simRef.current) simRef.current = createSim(size)
    else resetSim(simRef.current, size)
  }, [size])

  // One loop, stable for the life of the canvas.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = simRef.current
    if (!s) return
    s.lastTs = 0

    const frame = (ts: number) => {
      const dt = s.lastTs ? Math.min(0.05, (ts - s.lastTs) / 1000) : 0.016
      s.lastTs = ts

      update(s, dt)
      render(ctx, s, boardRef.current)

      // Feed React a coarse snapshot rather than 60 renders a second.
      s.uiCd -= dt
      if (s.uiCd <= 0) {
        s.uiCd = 0.09
        const knead = Math.round(s.knead)
        const bake = Math.round(s.bake)
        const pieces = s.doughs.length
        const roll = Math.round(s.roll * 100)
        const prev = s.ui
        if (prev.knead !== knead || prev.bake !== bake || prev.pieces !== pieces || prev.roll !== roll) {
          s.ui = { knead, bake, pieces, roll }
          setUi(s.ui)
        }
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [size])

  // Pointer handling. Reads the sim directly so it never needs re-binding.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = simRef.current
    if (!s) return

    const posOf = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      if ('touches' in e) {
        const t = e.touches[0]
        if (!t) return null
        return { x: t.clientX - rect.left, y: t.clientY - rect.top }
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const press = (x: number, y: number) => {
      s.mouse.x = x
      s.mouse.y = y
      s.mouse.hover = true
      if (s.phase !== 'play') return
      s.mouse.pressed = true
      if (s.mode === 'cut' && splitAt(s, x, y)) {
        playPop()
        navigator.vibrate?.(30)
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      const p = posOf(e)
      if (!p) return
      press(p.x, p.y)
      if (s.phase === 'play') canvas.style.cursor = 'grabbing'
    }

    const onMouseMove = (e: MouseEvent) => {
      const p = posOf(e)
      if (!p) return
      s.mouse.x = p.x
      s.mouse.y = p.y
      s.mouse.hover = true
    }

    const onMouseUp = () => {
      s.mouse.pressed = false
      canvas.style.cursor = s.phase === 'play' ? 'grab' : 'default'
    }

    const onMouseLeave = () => {
      s.mouse.pressed = false
      s.mouse.hover = false
      canvas.style.cursor = s.phase === 'play' ? 'grab' : 'default'
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const p = posOf(e)
      if (!p) return
      press(p.x, p.y)
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const p = posOf(e)
      if (!p) return
      s.mouse.x = p.x
      s.mouse.y = p.y
    }

    const onTouchEnd = () => {
      s.mouse.pressed = false
      s.mouse.hover = false
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [size])

  const pickMode = useCallback((m: DoughMode) => {
    const s = simRef.current
    if (!s || s.phase !== 'play') return
    s.mode = m
    setMode(m)
    if (m === 'bake') {
      s.phase = 'baking'
      s.mouse.pressed = false
      setPhase('baking')
    }
  }, [])

  const takeItOut = useCallback(() => {
    const s = simRef.current
    if (!s || s.phase !== 'baking') return
    const type = judge(s)
    s.result = type
    s.phase = 'result'
    s.pop = 0
    setResult(type)
    setPhase('result')

    const firstTier = (type === 'boule' || type === 'baguette' || type === 'rolls') && s.knead >= KNEAD_FLOOR
    if (firstTier) playFanfare()
    else playPop()

    navigator.vibrate?.(100)
    setBakery((prev) => [...(Array.isArray(prev) ? prev : []), type].slice(-BAKERY_CAP))
  }, [setBakery])

  const newDough = useCallback(() => {
    const s = simRef.current
    if (!s) return
    resetSim(s, s.size)
    setMode('knead')
    setPhase('play')
    setResult(null)
    setUi(freshUi)
  }, [])

  const locked = phase !== 'play'

  const caption = phase === 'result' && result
    ? RESULTS[result].caption
    : phase === 'baking'
      ? ui.bake < 100
        ? 'baking...'
        : ui.bake <= BURNT_AT
          ? 'perfect! take it out!'
          : 'it is fine, everything is fine'
      : mode === 'knead'
        ? ui.knead < 100 ? 'knead me!' : 'perfectly kneaded'
        : mode === 'roll'
          ? ui.roll < 60 ? 'roll me out!' : 'nice baguette shape'
          : mode === 'cut'
            ? ui.pieces < MAX_PIECES ? 'tap to split!' : 'that is plenty of rolls'
            : 'into the oven'

  const counts = (Array.isArray(bakery) ? bakery : []).reduce<Partial<Record<ResultType, number>>>((acc, t) => {
    if (t in RESULTS) acc[t] = (acc[t] ?? 0) + 1
    return acc
  }, {})
  const shelf = SHELF_ORDER.filter((t) => (counts[t] ?? 0) > 0)

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        aria-label="Dough board. Knead, roll, cut and bake a loaf."
        className={`rounded-lg ${className}`}
        style={{ width: size, height: size, touchAction: 'none', cursor: locked ? 'default' : 'grab' }}
      />

      <p
        aria-live="polite"
        className={`min-h-[20px] text-center text-xs sm:text-sm ${
          phase === 'result' ? 'font-semibold text-amber-900' : 'text-amber-700'
        }`}
      >
        {phase === 'result' && result ? `${RESULTS[result].emoji} ${caption}` : caption}
      </p>

      <div className="flex gap-1 sm:gap-2">
        {(Object.keys(modeConfig) as DoughMode[]).map((m) => {
          const active = mode === m
          return (
            <motion.button
              key={m}
              onClick={() => pickMode(m)}
              disabled={locked}
              whileTap={locked ? undefined : { scale: 0.95 }}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                active
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              } ${locked && !active ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span>{modeConfig[m].emoji}</span>
              <span className="hidden sm:inline">{modeConfig[m].label}</span>
            </motion.button>
          )
        })}
      </div>

      <div className="w-full max-w-[220px]">
        <div className="flex justify-between text-[11px] text-amber-600">
          <span>kneaded</span>
          <span>{ui.knead}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Dough development"
          aria-valuenow={ui.knead}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative h-1.5 rounded-full bg-amber-100 overflow-hidden"
        >
          <div
            className="h-full bg-amber-500 transition-[width] duration-100 ease-linear"
            style={{ width: `${ui.knead}%` }}
          />
          {/* Anything left of this notch bakes into a brick. */}
          <span aria-hidden className="absolute inset-y-0 left-[30%] w-px bg-amber-700/30" />
        </div>
      </div>

      <div className="min-h-[44px] flex items-center justify-center">
        {phase === 'baking' && (
          <motion.button
            onClick={takeItOut}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 rounded-full bg-amber-600 text-white text-sm font-medium shadow-md hover:bg-amber-700 transition-colors"
          >
            Take it out! 🧤
          </motion.button>
        )}
        {phase === 'result' && (
          <motion.button
            onClick={newDough}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 rounded-full bg-white text-amber-700 text-sm font-medium shadow-md border border-amber-200 hover:bg-amber-50 transition-colors"
          >
            New dough 🤲
          </motion.button>
        )}
      </div>

      {shelf.length > 0 && (
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-wide text-amber-500">Josh&apos;s Bakery</p>
          <div className="mt-0.5 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-amber-700">
            {shelf.map((t) => (
              <span key={t} title={RESULTS[t].label}>
                {RESULTS[t].emoji} {counts[t]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
