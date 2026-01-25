import { useEffect, useRef } from 'react'
import p5 from 'p5'
import type { BreadCategory } from '../types'

interface CategoryBackgroundProps {
  category: BreadCategory
  className?: string
}

// Extended p5 type for curveVertex
type P5Extended = p5 & {
  curveVertex: (x: number, y: number) => void
}

export function CategoryBackground({ category, className = '' }: CategoryBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5InstanceRef = useRef<p5 | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const sketch = (p: P5Extended) => {
      p.setup = () => {
        const parent = containerRef.current!
        const canvas = p.createCanvas(parent.offsetWidth, parent.offsetHeight)
        canvas.style('position', 'absolute')
        canvas.style('top', '0')
        canvas.style('left', '0')
        canvas.style('pointer-events', 'none')
        p.noLoop() // Static pattern, redraw on resize
        draw()
      }

      const draw = () => {
        p.clear()

        switch (category) {
          case 'sourdough':
            drawSourdough(p)
            break
          case 'flatbread':
            drawFlatbread(p)
            break
          case 'enriched':
            drawEnriched(p)
            break
          case 'quick':
            drawQuickBread(p)
            break
          case 'artisan':
            drawArtisan(p)
            break
        }
      }

      // Sourdough: Bubbly, organic circles (like crumb structure)
      const drawSourdough = (p: P5Extended) => {
        p.noStroke()
        const bubbleCount = 40
        p.randomSeed(42) // Consistent pattern

        for (let i = 0; i < bubbleCount; i++) {
          const x = p.random(p.width)
          const y = p.random(p.height)
          const size = p.random(20, 80)
          const alpha = p.random(15, 40)

          // Outer bubble
          p.fill(217, 119, 6, alpha) // amber-600
          p.ellipse(x, y, size, size * p.random(0.8, 1.2))

          // Inner hole
          p.fill(254, 243, 199, alpha * 0.5) // amber-100
          p.ellipse(x + size * 0.1, y - size * 0.1, size * 0.4, size * 0.3)
        }
      }

      // Flatbread: Layered horizontal lines
      const drawFlatbread = (p: P5Extended) => {
        p.noFill()
        const lineCount = 15
        p.randomSeed(42)

        for (let i = 0; i < lineCount; i++) {
          const y = (p.height / lineCount) * i + p.random(-10, 10)
          const alpha = p.random(20, 50)

          p.stroke(234, 88, 12, alpha) // orange-600
          p.strokeWeight(p.random(1, 4))

          p.beginShape()
          for (let x = 0; x < p.width; x += 20) {
            p.curveVertex(x, y + p.random(-5, 5))
          }
          p.endShape()
        }
      }

      // Enriched: Soft, pillowy gradient blobs
      const drawEnriched = (p: P5Extended) => {
        p.noStroke()
        const blobCount = 12
        p.randomSeed(42)

        for (let i = 0; i < blobCount; i++) {
          const x = p.random(p.width)
          const y = p.random(p.height)
          const size = p.random(60, 150)

          // Gradient blob using multiple circles
          for (let j = 0; j < 5; j++) {
            const alpha = 30 - j * 5
            const s = size * (1 - j * 0.15)
            p.fill(253, 224, 71, alpha) // yellow-300
            p.ellipse(x, y, s, s * 0.7)
          }
        }
      }

      // Quick bread: Scattered, quick brush strokes
      const drawQuickBread = (p: P5Extended) => {
        const strokeCount = 30
        p.randomSeed(42)

        for (let i = 0; i < strokeCount; i++) {
          const x = p.random(p.width)
          const y = p.random(p.height)
          const len = p.random(30, 80)
          const angle = p.random(p.TWO_PI)
          const alpha = p.random(20, 50)

          p.stroke(132, 204, 22, alpha) // lime-500
          p.strokeWeight(p.random(2, 6))
          p.strokeCap(p.ROUND)

          const x2 = x + Math.cos(angle) * len
          const y2 = y + Math.sin(angle) * len
          p.line(x, y, x2, y2)
        }
      }

      // Artisan: Geometric, crafted patterns
      const drawArtisan = (p: P5Extended) => {
        p.noFill()
        p.randomSeed(42)

        // Diamond/wheat pattern
        const gridSize = 60
        for (let x = 0; x < p.width + gridSize; x += gridSize) {
          for (let y = 0; y < p.height + gridSize; y += gridSize) {
            const alpha = p.random(15, 35)
            p.stroke(120, 113, 108, alpha) // stone-500
            p.strokeWeight(1)

            // Draw diamond
            p.beginShape()
            p.vertex(x, y - gridSize / 3)
            p.vertex(x + gridSize / 3, y)
            p.vertex(x, y + gridSize / 3)
            p.vertex(x - gridSize / 3, y)
            p.endShape(p.CLOSE)

            // Cross lines
            p.line(x - 10, y, x + 10, y)
            p.line(x, y - 10, x, y + 10)
          }
        }
      }

      p.draw = draw

      p.windowResized = () => {
        const parent = containerRef.current!
        p.resizeCanvas(parent.offsetWidth, parent.offsetHeight)
        p.redraw()
      }
    }

    p5InstanceRef.current = new p5(sketch as (p: p5) => void, containerRef.current)

    return () => {
      p5InstanceRef.current?.remove()
    }
  }, [category])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
    />
  )
}
