import { motion } from 'framer-motion'

interface FavoriteButtonProps {
  active: boolean
  onToggle: () => void
  className?: string
}

export function FavoriteButton({ active, onToggle, className = '' }: FavoriteButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={e => {
        // Hearts live inside <Link> cards - don't navigate.
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      aria-label={active ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={active}
      className={`flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-sm transition-colors ${
        active ? 'bg-white/90 text-rose-500' : 'bg-black/25 text-white hover:bg-black/40'
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.51 4.04 3 5.5l7 7Z" />
      </svg>
    </motion.button>
  )
}
