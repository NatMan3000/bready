import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { DoughKneader } from '../creative/DoughKneader'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { type Bread } from '../types'
import breadsData from '../data/breads.json'

const breads = breadsData as Bread[]

const categories = [
  { id: 'sourdough', name: 'Sourdough', emoji: '🥖', description: 'Tangy, crusty, naturally leavened' },
  { id: 'flatbread', name: 'Flatbreads', emoji: '🫓', description: 'Thin, versatile, worldwide favorites' },
  { id: 'enriched', name: 'Enriched', emoji: '🥐', description: 'Rich with butter, eggs, and sweetness' },
  { id: 'quick', name: 'Quick Breads', emoji: '🧁', description: 'No yeast, ready in under an hour' },
  { id: 'artisan', name: 'Artisan', emoji: '🍞', description: 'Handcrafted with traditional methods' },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const MS_PER_DAY = 86400000

// Same loaf for everyone, all day - rolls over at midnight UTC.
// Computed once at module load so render stays pure.
const dayIndex = Math.floor(Date.now() / MS_PER_DAY) % breads.length
const breadOfTheDay = breads[dayIndex]

export function Home() {
  const navigate = useNavigate()
  const [bakes] = useLocalStorage<number>('bready:bakes', 0)

  const surpriseMe = () => {
    const pick = breads[Math.floor(Math.random() * breads.length)]
    navigate(`/breads/${pick.id}`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-2 sm:py-6"
      >
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-amber-900 mb-1 sm:mb-3">
          Welcome to Bready
        </h1>
        <p className="text-base sm:text-xl text-amber-700 max-w-2xl mx-auto">
          Discover the wonderful world of bread. Learn about different varieties,
          their origins, and how to make them at home.
        </p>
        {bakes > 0 && (
          <p className="text-amber-600 text-sm mt-3">
            🏆 {bakes} bake{bakes === 1 ? '' : 's'} finished with Bready
          </p>
        )}
      </motion.div>

      {/* Interactive Dough Kneader */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col items-center mt-2 mb-4"
      >
        <DoughKneader size={320} className="shadow-xl" />
      </motion.div>

      {/* Bread of the Day */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="mt-10"
      >
        <Link
          to={`/breads/${breadOfTheDay.id}`}
          className="block bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 border border-amber-100"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="h-44 sm:h-auto sm:w-56 flex-shrink-0 bg-gradient-to-br from-amber-100 to-amber-200 overflow-hidden">
              <img
                src={`${import.meta.env.BASE_URL}images/${breadOfTheDay.id}.jpg`}
                alt={breadOfTheDay.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-grow p-5 sm:p-6">
              <span className="block text-amber-500 text-xs font-semibold uppercase tracking-wide">
                Bread of the day
              </span>
              <h2 className="font-display text-2xl text-amber-900 mt-1">{breadOfTheDay.name}</h2>
              <p className="text-sm text-amber-600">{breadOfTheDay.origin}</p>
              <p className="text-sm text-amber-700 mt-2 line-clamp-2">{breadOfTheDay.description}</p>
              <span className="block text-xs text-amber-500 mt-3">
                {'★'.repeat(breadOfTheDay.difficulty)}{'☆'.repeat(5 - breadOfTheDay.difficulty)}
              </span>
            </div>
          </div>
        </Link>

        <div className="flex justify-center mt-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={surpriseMe}
            className="px-6 py-3 bg-white text-amber-700 rounded-full font-medium hover:bg-amber-50 transition-colors shadow-md border border-amber-200"
          >
            Surprise me 🎲
          </motion.button>
        </div>
      </motion.section>

      {/* Category Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-16"
      >
        {categories.map((category) => (
          <motion.div key={category.id} variants={item}>
            <Link
              to={`/breads?category=${category.id}`}
              className="block p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 border border-amber-100"
            >
              <span className="text-4xl mb-3 block">{category.emoji}</span>
              <h3 className="text-lg font-semibold text-amber-900">{category.name}</h3>
              <p className="text-amber-600 text-sm mt-1">{category.description}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center gap-4 mt-12"
      >
        <Link
          to="/breads"
          className="px-6 py-3 bg-amber-600 text-white rounded-full font-medium hover:bg-amber-700 transition-colors shadow-md"
        >
          Browse All Breads
        </Link>
        <Link
          to="/recipes"
          className="px-6 py-3 bg-white text-amber-700 rounded-full font-medium hover:bg-amber-50 transition-colors shadow-md border border-amber-200"
        >
          View Recipes
        </Link>
      </motion.div>
    </div>
  )
}
