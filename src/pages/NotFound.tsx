import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-7xl mb-4" aria-hidden>
          🍞🔥
        </div>
        <h1 className="font-display text-4xl font-bold text-amber-900 mb-3">
          Well, that one burnt.
        </h1>
        <p className="text-amber-700 max-w-md mx-auto mb-8">
          The page you're after either never proofed or got eaten. Either way, there's
          nothing to see here but crumbs.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-amber-600 text-white rounded-full font-medium hover:bg-amber-700 transition-colors shadow-md"
        >
          Back to fresh bread
        </Link>
      </motion.div>
    </div>
  )
}
