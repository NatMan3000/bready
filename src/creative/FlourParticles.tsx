import { useEffect, useRef } from 'react'
import p5 from 'p5'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
}

interface FlourParticlesProps {
  density?: number
  className?: string
}

export function FlourParticles({ density = 60, className = '' }: FlourParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<p5 | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const sketch = (p: p5) => {
      let particles: Particle[] = []
      let mouseX = 0
      let mouseY = 0

      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight)
        canvas.style('position', 'fixed')
        canvas.style('top', '0')
        canvas.style('left', '0')
        canvas.style('pointer-events', 'none')
        canvas.style('z-index', '5')

        // Initialize particles
        for (let i = 0; i < density; i++) {
          particles.push(createParticle(p))
        }
      }

      const createParticle = (p: p5): Particle => ({
        x: p.random(p.width),
        y: p.random(p.height),
        size: p.random(4, 12),
        speedX: p.random(-0.3, 0.3),
        speedY: p.random(0.3, 0.8),  // Positive = floating down like settling flour
        opacity: p.random(180, 255)
      })

      p.draw = () => {
        p.clear()

        particles.forEach((particle) => {
          // Gentle drift away from mouse
          const dx = particle.x - mouseX
          const dy = particle.y - mouseY
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 100) {
            const force = (100 - dist) / 100
            particle.x += (dx / dist) * force * 0.5
            particle.y += (dy / dist) * force * 0.5
          }

          // Update position
          particle.x += particle.speedX
          particle.y += particle.speedY

          // Wrap around screen (respawn at top when falling off bottom)
          if (particle.y > p.height + 10) {
            particle.y = -10
            particle.x = p.random(p.width)
          }
          if (particle.x < -10) particle.x = p.width + 10
          if (particle.x > p.width + 10) particle.x = -10

          // Draw particle
          p.noStroke()
          // Tan/wheat flour specks - darker to contrast with amber background
          p.fill(245, 245, 245, particle.opacity)
          p.ellipse(particle.x, particle.y, particle.size)
        })
      }

      p.mouseMoved = () => {
        mouseX = p.mouseX
        mouseY = p.mouseY
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight)
      }
    }

    p5InstanceRef.current = new p5(sketch, containerRef.current)

    return () => {
      p5InstanceRef.current?.remove()
    }
  }, [density])

  return <div ref={containerRef} className={className} />
}
