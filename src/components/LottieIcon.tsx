import Lottie from 'lottie-react'
import { useEffect, useState } from 'react'

type IconType = 'mix' | 'knead' | 'proof' | 'shape' | 'bake' | 'cool' | 'check'

export interface LottieIconProps {
  icon: IconType
  size?: number
  className?: string
  loop?: boolean
  autoplay?: boolean
  playing?: boolean // alias for autoplay
}

// Fallback emoji icons when Lottie files aren't available
const FALLBACK_ICONS: Record<IconType, string> = {
  mix: '🥄',
  knead: '🤲',
  proof: '⏰',
  shape: '✋',
  bake: '🔥',
  cool: '❄️',
  check: '✅',
}

// Lottie file paths (will be loaded from public/lotties/)
const LOTTIE_PATHS: Record<IconType, string> = {
  mix: '/lotties/mix.json',
  knead: '/lotties/knead.json',
  proof: '/lotties/timer.json',
  shape: '/lotties/shape.json',
  bake: '/lotties/oven.json',
  cool: '/lotties/cool.json',
  check: '/lotties/check.json',
}

export function LottieIcon({
  icon,
  size = 48,
  className = '',
  loop = true,
  autoplay = true,
  playing,
}: LottieIconProps) {
  // playing prop takes precedence over autoplay if provided
  const shouldPlay = playing !== undefined ? playing : autoplay
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Try to load the Lottie file
    fetch(LOTTIE_PATHS[icon])
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(setAnimationData)
      .catch(() => setHasError(true))
  }, [icon])

  // Show fallback emoji if Lottie fails to load
  if (hasError || !animationData) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: size * 0.6 }}>{FALLBACK_ICONS[icon]}</span>
      </div>
    )
  }

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={shouldPlay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

// Simple icon display without animation (just emoji)
export function StepIcon({ icon, size = 32 }: { icon: IconType; size?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-amber-100 rounded-full"
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.5 }}>{FALLBACK_ICONS[icon]}</span>
    </div>
  )
}
