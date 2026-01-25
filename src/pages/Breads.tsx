import { motion } from 'framer-motion'
import { useSearchParams, Link } from 'react-router-dom'
import { CATEGORY_LABELS, type BreadCategory, type Bread } from '../types'
import breadsData from '../data/breads.json'

const breads = breadsData as Bread[]

const categories = Object.entries(CATEGORY_LABELS) as [BreadCategory, string][]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 }
}

export function Breads() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') as BreadCategory | null

  const filteredBreads = activeCategory
    ? breads.filter(b => b.category === activeCategory)
    : breads

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-amber-900 mb-2"
      >
        Bread Encyclopedia
      </motion.h1>
      <p className="text-amber-600 mb-8">Discover breads from around the world</p>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2 mb-8"
      >
        <button
          onClick={() => setSearchParams({})}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !activeCategory
              ? 'bg-amber-600 text-white'
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          All
        </button>
        {categories.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSearchParams({ category: key })}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === key
                ? 'bg-amber-600 text-white'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Bread Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        key={activeCategory || 'all'}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredBreads.map((bread) => (
          <motion.div key={bread.id} variants={item}>
            <Link
              to={`/breads/${bread.id}`}
              className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 border border-amber-100"
            >
              {/* Bread image */}
              <div className="h-40 bg-gradient-to-br from-amber-100 to-amber-200 overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}images/${bread.id}.png`}
                  alt={bread.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-amber-900">{bread.name}</h3>
                <p className="text-sm text-amber-600">{bread.origin}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                    {CATEGORY_LABELS[bread.category]}
                  </span>
                  <span className="text-xs text-amber-500">
                    {'★'.repeat(bread.difficulty)}{'☆'.repeat(5 - bread.difficulty)}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {filteredBreads.length === 0 && (
        <p className="text-center text-amber-600 py-12">
          No breads found in this category yet.
        </p>
      )}
    </div>
  )
}
