import { useEffect, useRef } from 'react'

// Flour-burst confetti: flour puffs (circles) and crumbs (rects) in the bread
// palette. Zero dependencies; skipped entirely under prefers-reduced-motion.

const COLORS = ['#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#92400e', '#ffffff']

interface CelebrationProps {
  onDone: () => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rot: number
  vr: number
  crumb: boolean
}

export function Celebration({ onDone }: CelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const t = setTimeout(() => onDoneRef.current(), 800)
      return () => clearTimeout(t)
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const parts: Particle[] = []
    for (let i = 0; i < 140; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6
      const speed = 7 + Math.random() * 9
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * 140,
        y: H * 0.8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        crumb: Math.random() < 0.45,
      })
    }

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, W, H)
      const fade = Math.max(0, 1 - t / 2.2)
      for (const p of parts) {
        p.vy += 0.25
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        ctx.globalAlpha = fade
        ctx.fillStyle = p.color
        if (p.crumb) {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
          ctx.restore()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      if (t < 2.3) {
        raf = requestAnimationFrame(tick)
      } else {
        onDoneRef.current()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden
    />
  )
}
