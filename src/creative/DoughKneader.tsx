import { useEffect, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'

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

type DoughMode = 'knead' | 'roll' | 'cut' | 'bake'

interface DoughKneaderProps {
  size?: number
  className?: string
}

const modeConfig: Record<DoughMode, { emoji: string; label: string }> = {
  knead: { emoji: '🤲', label: 'Knead' },
  roll: { emoji: '🪨', label: 'Roll' },
  cut: { emoji: '🔪', label: 'Cut' },
  bake: { emoji: '🔥', label: 'Bake' },
}

export function DoughKneader({ size = 200, className = '' }: DoughKneaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const doughsRef = useRef<DoughPiece[]>([])
  const mouseRef = useRef({ x: 0, y: 0, pressed: false })
  const animationRef = useRef<number>(0)

  const [mode, setMode] = useState<DoughMode>('knead')
  const [bakeProgress, setBakeProgress] = useState(0)
  const [rollProgress, setRollProgress] = useState(0) // 0 = round, 1 = full sausage
  const cutCountRef = useRef(0) // Track cuts to alternate direction

  const numPoints = 16
  const baseRadius = size * 0.25
  const centerX = size / 2
  const centerY = size / 2

  // Create a dough piece at position
  const createDough = useCallback((cx: number, cy: number, radius: number): DoughPiece => {
    const points: Point[] = []
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2
      points.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      })
    }
    return { points, cx, cy, radius }
  }, [numPoints])

  // Initialize single dough
  useEffect(() => {
    doughsRef.current = [createDough(centerX, centerY, baseRadius)]
  }, [size, createDough, centerX, centerY, baseRadius])

  // Reset when mode changes
  useEffect(() => {
    if (mode !== 'bake') setBakeProgress(0)
    if (mode !== 'roll') setRollProgress(0)
    if (mode !== 'cut') {
      // Reset to single dough when leaving cut mode
      doughsRef.current = [createDough(centerX, centerY, baseRadius)]
      cutCountRef.current = 0
    }
  }, [mode, createDough, centerX, centerY, baseRadius])

  // Baking animation
  useEffect(() => {
    if (mode !== 'bake' || bakeProgress >= 100) return
    const interval = setInterval(() => {
      setBakeProgress(p => Math.min(100, p + 1))
    }, 50)
    return () => clearInterval(interval)
  }, [mode, bakeProgress])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const doughs = doughsRef.current
    const mouse = mouseRef.current

    // Draw wooden cutting board background
    const boardGradient = ctx.createLinearGradient(0, 0, size, size)
    boardGradient.addColorStop(0, '#deb887')
    boardGradient.addColorStop(0.3, '#d2a679')
    boardGradient.addColorStop(0.6, '#c9976b')
    boardGradient.addColorStop(1, '#bc8b5e')

    ctx.fillStyle = boardGradient
    ctx.fillRect(0, 0, size, size)

    // Wood grain lines
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.15)'
    ctx.lineWidth = 1
    for (let i = 0; i < size; i += 12) {
      ctx.beginPath()
      ctx.moveTo(0, i + Math.sin(i * 0.1) * 3)
      ctx.lineTo(size, i + Math.sin(i * 0.1 + 2) * 3)
      ctx.stroke()
    }

    // Board edge/border
    ctx.strokeStyle = '#835a35'
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, size - 3, size - 3)

    // Physics constants
    const damping = 0.92
    const stiffness = 0.3
    const mouseRadius = 60
    const mouseForce = 0.35
    const returnForce = 0.04

    // Update each dough piece
    for (const dough of doughs) {
      const { points, cx: doughCx, cy: doughCy, radius } = dough

      // Baking makes dough puff up
      const bakeExpand = mode === 'bake' && bakeProgress > 20
        ? 1 + (bakeProgress - 20) / 80 * 0.2
        : 1

      // Roll makes sausage shape: wide X, narrow Y
      const xStretch = mode === 'roll' ? 1 + rollProgress * 1.2 : 1
      const yStretch = mode === 'roll' ? 1 - rollProgress * 0.5 : 1

      const effectiveRadius = radius * bakeExpand

      // Apply forces to points
      for (let i = 0; i < points.length; i++) {
        const point = points[i]
        const angle = (i / numPoints) * Math.PI * 2

        // Rest position - elliptical when rolling
        const restX = doughCx + Math.cos(angle) * effectiveRadius * xStretch
        const restY = doughCy + Math.sin(angle) * effectiveRadius * yStretch

        // Spring back to rest position (keeps dough centered)
        point.vx += (restX - point.x) * returnForce
        point.vy += (restY - point.y) * returnForce

        // Mouse interaction
        if (mouse.pressed && mode !== 'bake' && mode !== 'cut') {
          const dx = point.x - mouse.x
          const dy = point.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < mouseRadius && dist > 0) {
            const force = ((mouseRadius - dist) / mouseRadius) * mouseForce
            if (mode === 'knead') {
              // Pull toward mouse
              point.vx += (mouse.x - point.x) * force * 0.25
              point.vy += (mouse.y - point.y) * force * 0.25
            } else if (mode === 'roll') {
              // Spread horizontally only
              point.vx += (point.x > doughCx ? 1 : -1) * force * 2
            }
          }
        }

        point.x += point.vx
        point.y += point.vy
        point.vx *= damping
        point.vy *= damping
      }

      // Constraint iterations
      for (let iter = 0; iter < 2; iter++) {
        for (let i = 0; i < numPoints; i++) {
          const next = (i + 1) % numPoints
          const p1 = points[i]
          const p2 = points[next]

          const dx = p2.x - p1.x
          const dy = p2.y - p1.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const avgStretch = (xStretch + yStretch) / 2
          const targetDist = (2 * Math.PI * effectiveRadius * avgStretch) / numPoints

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

        // Keep in bounds
        for (const point of points) {
          point.x = Math.max(8, Math.min(size - 8, point.x))
          point.y = Math.max(8, Math.min(size - 8, point.y))
        }
      }

      // Update center
      dough.cx = points.reduce((sum, p) => sum + p.x, 0) / numPoints
      dough.cy = points.reduce((sum, p) => sum + p.y, 0) / numPoints
    }

    // Dough colors
    let color1 = '#fef3c7'
    let color2 = '#fde68a'
    let color3 = '#fcd34d'

    if (mode === 'bake') {
      const t = bakeProgress / 100
      color1 = lerpColor('#fef3c7', '#f59e0b', t * 0.7)
      color2 = lerpColor('#fde68a', '#d97706', t * 0.8)
      color3 = lerpColor('#fcd34d', '#b45309', t * 0.9)
    }

    // Draw each dough piece
    for (const dough of doughs) {
      const { points, cx, cy, radius } = dough

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

      // Dough body
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

      // Crust when baked
      if (mode === 'bake' && bakeProgress > 50) {
        ctx.strokeStyle = `rgba(139, 69, 19, ${(bakeProgress - 50) / 50 * 0.4})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Highlight
      ctx.beginPath()
      ctx.ellipse(cx - 8, cy - 8, 8 * (radius / baseRadius), 5 * (radius / baseRadius), -0.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${mode === 'bake' ? 0.2 : 0.4})`
      ctx.fill()
    }

    // Draw text on first dough only
    if (!mouse.pressed && doughs.length > 0) {
      const mainDough = doughs[0]
      ctx.font = `${doughs.length > 2 ? 10 : 12}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = mode === 'bake' && bakeProgress > 50
        ? 'rgba(255, 255, 255, 0.9)'
        : 'rgba(139, 69, 19, 0.8)'

      const maxPieces = 20
      const texts: Record<DoughMode, string> = {
        knead: 'knead me!',
        roll: rollProgress < 0.8 ? 'roll me!' : 'Baguette!',
        cut: doughs.length < maxPieces ? 'tap to split!' : 'max!',
        bake: bakeProgress < 100 ? `${bakeProgress}%` : '🥖',
      }
      ctx.fillText(texts[mode], mainDough.cx, mainDough.cy)
    }

    animationRef.current = requestAnimationFrame(draw)
  }, [size, numPoints, baseRadius, mode, bakeProgress, rollProgress])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animationRef.current)
  }, [draw])

  // Split dough into two pieces - alternates horizontal/vertical
  const splitDough = useCallback((tapX: number, tapY: number) => {
    const doughs = doughsRef.current
    const maxPieces = 20
    if (doughs.length >= maxPieces) return

    // Find which dough was tapped
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

    if (tappedIdx === -1) return

    const tapped = doughs[tappedIdx]
    const newRadius = tapped.radius * 0.75
    const offset = 15 + newRadius * 0.5

    // Alternate between horizontal (even) and vertical (odd) cuts
    const isVerticalCut = cutCountRef.current % 2 === 1

    let dough1: DoughPiece, dough2: DoughPiece

    if (isVerticalCut) {
      // Vertical cut: split top/bottom
      dough1 = createDough(tapped.cx, tapped.cy - offset, newRadius)
      dough2 = createDough(tapped.cx, tapped.cy + offset, newRadius)
      dough1.points.forEach(p => { p.vy = -2.5 })
      dough2.points.forEach(p => { p.vy = 2.5 })
    } else {
      // Horizontal cut: split left/right
      dough1 = createDough(tapped.cx - offset, tapped.cy, newRadius)
      dough2 = createDough(tapped.cx + offset, tapped.cy, newRadius)
      dough1.points.forEach(p => { p.vx = -2.5 })
      dough2.points.forEach(p => { p.vx = 2.5 })
    }

    cutCountRef.current++
    doughs.splice(tappedIdx, 1, dough1, dough2)
  }, [createDough])

  const getPosition = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleInteraction = useCallback((pos: { x: number; y: number }, isStart: boolean) => {
    if (mode === 'cut' && isStart) {
      splitDough(pos.x, pos.y)
    } else if (mode === 'roll') {
      // Gradually increase roll progress (make more sausage-like)
      setRollProgress(r => Math.min(1, r + 0.02))
    }
  }, [mode, splitDough])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseDown = (e: MouseEvent) => {
      const pos = getPosition(e)
      mouseRef.current = { x: pos.x, y: pos.y, pressed: true }
      handleInteraction(pos, true)
      canvas.style.cursor = 'grabbing'
    }

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getPosition(e)
      mouseRef.current.x = pos.x
      mouseRef.current.y = pos.y
      if (mouseRef.current.pressed) handleInteraction(pos, false)
    }

    const handleMouseUp = () => {
      mouseRef.current.pressed = false
      canvas.style.cursor = 'grab'
    }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const pos = getPosition(e)
      mouseRef.current = { x: pos.x, y: pos.y, pressed: true }
      handleInteraction(pos, true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const pos = getPosition(e)
      mouseRef.current.x = pos.x
      mouseRef.current.y = pos.y
      if (mouseRef.current.pressed) handleInteraction(pos, false)
    }

    const handleTouchEnd = () => {
      mouseRef.current.pressed = false
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseUp)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleInteraction])

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={`rounded-lg cursor-grab ${className}`}
        style={{ touchAction: 'none' }}
      />

      <div className="flex gap-1 sm:gap-2">
        {(Object.keys(modeConfig) as DoughMode[]).map((m) => (
          <motion.button
            key={m}
            onClick={() => setMode(m)}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              mode === m
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <span>{modeConfig[m].emoji}</span>
            <span className="hidden sm:inline">{modeConfig[m].label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  if (!c1 || !c2) return color1
  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const b = Math.round(c1.b + (c2.b - c1.b) * t)
  return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null
}
