import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { type Bread, CATEGORY_LABELS } from '../types'
import breadsData from '../data/breads.json'
import recipesData from '../data/recipes.json'

const breads = breadsData as Bread[]

export function BreadDetail() {
  const { id } = useParams<{ id: string }>()
  const bread = breads.find(b => b.id === id)

  if (!bread) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-amber-900 mb-4">Bread not found</h1>
        <Link to="/breads" className="text-amber-600 hover:text-amber-700">
          ← Back to breads
        </Link>
      </div>
    )
  }

  // Find associated recipe if one exists
  const recipe = recipesData.find(r => r.breadId === bread.id)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          to="/breads"
          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700"
        >
          ← Back to breads
        </Link>
      </motion.div>

      {/* Hero section with bread image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-2xl overflow-hidden mb-8"
      >
        <img
          src={`/images/${bread.id}.png`}
          alt={bread.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm mb-2 inline-block">
            {CATEGORY_LABELS[bread.category]}
          </span>
          <h1 className="text-4xl font-bold">{bread.name}</h1>
          <p className="text-white/80">{bread.origin}</p>
        </div>
      </motion.div>

      {/* Content grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-6"
        >
          {/* Description */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-amber-100">
            <h2 className="text-xl font-semibold text-amber-900 mb-3">About</h2>
            <p className="text-amber-800 leading-relaxed">{bread.description}</p>
          </div>

          {/* Characteristics */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-amber-100">
            <h2 className="text-xl font-semibold text-amber-900 mb-4">Characteristics</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🥐</span>
                <div>
                  <h3 className="font-medium text-amber-900">Crust</h3>
                  <p className="text-amber-700">{bread.characteristics.crust}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🍞</span>
                <div>
                  <h3 className="font-medium text-amber-900">Crumb</h3>
                  <p className="text-amber-700">{bread.characteristics.crumb}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">👅</span>
                <div>
                  <h3 className="font-medium text-amber-900">Flavor</h3>
                  <p className="text-amber-700">{bread.characteristics.flavor}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fun fact */}
          {bread.funFact && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-amber-50 rounded-xl p-6 border border-amber-200"
            >
              <h2 className="text-lg font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <span>💡</span> Did you know?
              </h2>
              <p className="text-amber-800">{bread.funFact}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Difficulty */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-amber-100">
            <h2 className="text-lg font-semibold text-amber-900 mb-3">Difficulty</h2>
            <div className="flex items-center gap-2">
              <div className="text-2xl">
                {'★'.repeat(bread.difficulty)}
                <span className="text-amber-200">{'★'.repeat(5 - bread.difficulty)}</span>
              </div>
            </div>
            <p className="text-sm text-amber-600 mt-2">
              {bread.difficulty <= 2 ? 'Beginner friendly' :
               bread.difficulty <= 3 ? 'Intermediate' : 'Advanced'}
            </p>
          </div>

          {/* Recipe link */}
          {recipe ? (
            <Link
              to={`/recipes/${recipe.id}`}
              className="block bg-amber-600 text-white rounded-xl p-6 shadow-md hover:bg-amber-700 transition-colors"
            >
              <h2 className="text-lg font-semibold mb-2">Make this bread!</h2>
              <p className="text-amber-100 text-sm">{recipe.name}</p>
              <div className="mt-4 flex items-center gap-1">
                <span>View recipe</span>
                <span>→</span>
              </div>
            </Link>
          ) : (
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <h2 className="text-lg font-semibold text-amber-900 mb-2">Recipe coming soon</h2>
              <p className="text-amber-700 text-sm">
                We're working on bringing you the perfect recipe for this bread.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
