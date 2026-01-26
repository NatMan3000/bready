import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { type Recipe } from '../types'
import recipesData from '../data/recipes.json'

const recipes = recipesData as Recipe[]

function formatTime(minutes: number): string {
  if (minutes === 0) return 'None'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
}

export function Recipes() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-amber-900 mb-2"
      >
        Recipes
      </motion.h1>
      <p className="text-amber-600 mb-8">Step-by-step guides to baking perfection</p>

      {/* Recipe List */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {recipes.map((recipe) => (
          <motion.div key={recipe.id} variants={item}>
            <Link
              to={`/recipes/${recipe.id}`}
              className="flex items-center gap-4 bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all hover:-translate-x-1 border border-amber-100"
            >
              {/* Bread image */}
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={`${import.meta.env.BASE_URL}images/${recipe.breadId}.jpg`}
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-grow">
                <h3 className="font-semibold text-amber-900 text-lg">{recipe.name}</h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-amber-600">
                  <span className="flex items-center gap-1">
                    <span>⏱️</span> Prep: {formatTime(recipe.prepTime)}
                  </span>
                  {recipe.proofTime > 0 && (
                    <span className="flex items-center gap-1">
                      <span>🕐</span> Proof: {formatTime(recipe.proofTime)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span>🔥</span> Bake: {formatTime(recipe.bakeTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>🍽️</span> Serves: {recipe.servings}
                  </span>
                </div>
              </div>

              <div className="text-amber-400 text-2xl">
                →
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {recipes.length === 0 && (
        <p className="text-center text-amber-600 py-12">
          No recipes available yet. Check back soon!
        </p>
      )}
    </div>
  )
}
