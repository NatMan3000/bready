import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { type Recipe, type Bread } from '../types'
import { LottieIcon } from '../components/LottieIcon'
import recipesData from '../data/recipes.json'
import breadsData from '../data/breads.json'

const recipes = recipesData as Recipe[]
const breads = breadsData as Bread[]

function formatTime(minutes: number): string {
  if (minutes === 0) return 'None'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const recipe = recipes.find(r => r.id === id)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-amber-900 mb-4">Recipe not found</h1>
        <Link to="/recipes" className="text-amber-600 hover:text-amber-700">
          ← Back to recipes
        </Link>
      </div>
    )
  }

  const bread = breads.find(b => b.id === recipe.breadId)
  const totalTime = recipe.prepTime + recipe.proofTime + recipe.bakeTime

  const toggleStep = (stepOrder: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepOrder)) {
        newSet.delete(stepOrder)
      } else {
        newSet.add(stepOrder)
      }
      return newSet
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          to="/recipes"
          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700"
        >
          ← Back to recipes
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-amber-900 mb-2">{recipe.name}</h1>
        {bread && (
          <Link
            to={`/breads/${bread.id}`}
            className="text-amber-600 hover:text-amber-700"
          >
            Learn more about {bread.name} →
          </Link>
        )}
      </motion.div>

      {/* Time overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8"
      >
        <div className="bg-white rounded-xl p-4 shadow-md border border-amber-100 text-center">
          <span className="text-2xl">⏱️</span>
          <p className="text-sm text-amber-600 mt-1">Prep</p>
          <p className="font-semibold text-amber-900">{formatTime(recipe.prepTime)}</p>
        </div>
        {recipe.proofTime > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-md border border-amber-100 text-center">
            <span className="text-2xl">🕐</span>
            <p className="text-sm text-amber-600 mt-1">Proof</p>
            <p className="font-semibold text-amber-900">{formatTime(recipe.proofTime)}</p>
          </div>
        )}
        <div className="bg-white rounded-xl p-4 shadow-md border border-amber-100 text-center">
          <span className="text-2xl">🔥</span>
          <p className="text-sm text-amber-600 mt-1">Bake</p>
          <p className="font-semibold text-amber-900">{formatTime(recipe.bakeTime)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-amber-100 text-center">
          <span className="text-2xl">⏰</span>
          <p className="text-sm text-amber-600 mt-1">Total</p>
          <p className="font-semibold text-amber-900">{formatTime(totalTime)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-amber-100 text-center">
          <span className="text-2xl">🍽️</span>
          <p className="text-sm text-amber-600 mt-1">Serves</p>
          <p className="font-semibold text-amber-900">{recipe.servings}</p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Ingredients sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-1"
        >
          <div className="bg-white rounded-xl p-6 shadow-md border border-amber-100 sticky top-24">
            <h2 className="text-xl font-semibold text-amber-900 mb-4 flex items-center gap-2">
              <span>🧺</span> Ingredients
            </h2>
            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex justify-between items-start border-b border-amber-50 pb-2 last:border-0"
                >
                  <span className="text-amber-800">{ingredient.name}</span>
                  <span className="text-amber-600 font-medium whitespace-nowrap ml-2">
                    {ingredient.amount} {ingredient.unit}
                  </span>
                </motion.li>
              ))}
            </ul>
            {recipe.ingredients.some(i => i.notes) && (
              <div className="mt-4 pt-4 border-t border-amber-100">
                <p className="text-xs text-amber-500">
                  {recipe.ingredients
                    .filter(i => i.notes)
                    .map(i => `${i.name}: ${i.notes}`)
                    .join(' • ')}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          <h2 className="text-xl font-semibold text-amber-900 mb-4 flex items-center gap-2">
            <span>📋</span> Instructions
          </h2>

          <div className="space-y-4">
            <AnimatePresence>
              {recipe.steps.map((step, index) => (
                <motion.div
                  key={step.order}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`bg-white rounded-xl p-4 shadow-md border transition-all cursor-pointer ${
                    completedSteps.has(step.order)
                      ? 'border-green-300 bg-green-50'
                      : 'border-amber-100 hover:border-amber-300'
                  }`}
                  onClick={() => toggleStep(step.order)}
                >
                  <div className="flex gap-4">
                    {/* Step number and icon */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                        completedSteps.has(step.order)
                          ? 'bg-green-500 text-white'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {completedSteps.has(step.order) ? '✓' : step.order}
                      </div>
                      {step.icon && (
                        <div className="mt-2">
                          <LottieIcon
                            icon={step.icon}
                            size={32}
                            playing={!completedSteps.has(step.order)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-grow">
                      <p className={`text-amber-800 leading-relaxed ${
                        completedSteps.has(step.order) ? 'line-through opacity-60' : ''
                      }`}>
                        {step.instruction}
                      </p>
                      {step.duration && (
                        <p className="text-sm text-amber-500 mt-2">
                          ⏱️ {formatTime(step.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Progress indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-white rounded-xl p-4 shadow-md border border-amber-100"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-700">Progress</span>
              <span className="font-medium text-amber-900">
                {completedSteps.size} / {recipe.steps.length} steps
              </span>
            </div>
            <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-500"
                initial={{ width: 0 }}
                animate={{
                  width: `${(completedSteps.size / recipe.steps.length) * 100}%`
                }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
          </motion.div>

          {/* Tips section */}
          {recipe.tips && recipe.tips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 bg-amber-50 rounded-xl p-6 border border-amber-200"
            >
              <h2 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <span>💡</span> Pro Tips
              </h2>
              <ul className="space-y-2">
                {recipe.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-amber-800">
                    <span className="text-amber-500 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
