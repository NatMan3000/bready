import { lazy, Suspense, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { type Recipe, type Bread } from '../types'

// lottie-web is ~280KB minified - the icons degrade to emoji anyway, so lazy-load
const LottieIcon = lazy(() =>
  import('../components/LottieIcon').then(m => ({ default: m.LottieIcon }))
)
import { StepTimer } from '../components/StepTimer'
import { Celebration } from '../components/Celebration'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useStepTimers, formatCountdown } from '../hooks/useStepTimers'
import { useWakeLock } from '../hooks/useWakeLock'
import { playPop, playFanfare } from '../lib/sound'
import { SCALE_OPTIONS, formatScaleLabel, scaleAmount } from '../lib/scale'
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

const PILL_ACTIVE = 'bg-amber-600 text-white'
const PILL_IDLE = 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const recipe = recipes.find(r => r.id === id)

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

  // Keyed remount: every persisted hook below seeds itself from localStorage on
  // mount, so switching recipes must give them a fresh instance.
  return <RecipeView key={recipe.id} recipe={recipe} />
}

function RecipeView({ recipe }: { recipe: Recipe }) {
  const bread = breads.find(b => b.id === recipe.breadId)
  const totalTime = recipe.prepTime + recipe.proofTime + recipe.bakeTime
  const totalSteps = recipe.steps.length

  const [scale, setScale] = useLocalStorage(`bready:scale:${recipe.id}`, 1)
  const [checkedIngredients, setCheckedIngredients] = useLocalStorage<number[]>(
    `bready:ings:${recipe.id}`,
    []
  )
  const [completedSteps, setCompletedSteps] = useLocalStorage<number[]>(
    `bready:steps:${recipe.id}`,
    []
  )
  const [baked, setBaked] = useLocalStorage(`bready:baked:${recipe.id}`, false)
  const [, setBakes] = useLocalStorage('bready:bakes', 0)
  const [wakePref, setWakePref] = useLocalStorage('bready:wakelock', false)

  const { timers, start, pause, clear, clearAll } = useStepTimers(recipe.id)
  const { supported: wakeSupported } = useWakeLock(wakePref)
  const [celebrating, setCelebrating] = useState(false)

  const checked = useMemo(() => new Set(checkedIngredients), [checkedIngredients])
  const completed = useMemo(() => new Set(completedSteps), [completedSteps])

  // Count against the real step list so stale persisted orders can never
  // fake a finished bake.
  const doneCount = recipe.steps.filter(s => completed.has(s.order)).length
  const isComplete = totalSteps > 0 && doneCount === totalSteps

  const nextTimer = useMemo(() => {
    const running = Object.entries(timers)
      .filter(([, t]) => t.status === 'running')
      .map(([order, t]) => ({ order: Number(order), remainingMs: t.remainingMs }))
    if (running.length === 0) return null
    return running.reduce((soonest, t) => (t.remainingMs < soonest.remainingMs ? t : soonest))
  }, [timers])

  // Completion is only ever reached by a tap, so the celebration is fired from
  // the event rather than an effect - a reload of a finished recipe stays calm.
  const toggleStep = (stepOrder: number) => {
    const wasDone = completed.has(stepOrder)
    const next = wasDone
      ? completedSteps.filter(o => o !== stepOrder)
      : [...completedSteps, stepOrder]

    if (!wasDone) playPop()
    setCompletedSteps(next)

    const nextDone = new Set(next)
    const nowComplete = totalSteps > 0 && recipe.steps.every(s => nextDone.has(s.order))

    if (nowComplete && !isComplete) {
      setCelebrating(true)
      playFanfare()
      // The per-recipe flag stops a re-checked step counting a second bake.
      if (!baked) {
        setBakes(n => n + 1)
        setBaked(true)
      }
    } else if (!nowComplete && baked) {
      setBaked(false)
    }
  }

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const resetProgress = () => {
    setCompletedSteps([])
    setCheckedIngredients([])
    clearAll()
    setBaked(false)
    setCelebrating(false)
  }

  const scrollToStep = (order: number) => {
    document.getElementById(`step-${order}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

      {/* Hero image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-2xl overflow-hidden mb-6"
      >
        <img
          src={`${import.meta.env.BASE_URL}images/${recipe.breadId}.jpg`}
          alt={recipe.name}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="font-display text-3xl font-bold text-white drop-shadow-lg">
            {recipe.name}
          </h1>
        </div>
      </motion.div>

      {/* Controls row */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-center justify-between gap-3"
      >
        {bread ? (
          <Link to={`/breads/${bread.id}`} className="text-amber-600 hover:text-amber-700">
            Learn more about {bread.name} →
          </Link>
        ) : (
          <span />
        )}
        {wakeSupported && (
          <button
            onClick={() => setWakePref(v => !v)}
            aria-pressed={wakePref}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              wakePref ? PILL_ACTIVE : PILL_IDLE
            }`}
          >
            ☀️ Keep screen on
          </button>
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
          <p className="font-semibold text-amber-900">{Math.round(recipe.servings * scale)}</p>
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

            {/* Scaling */}
            <div className="flex flex-wrap gap-2 mb-3">
              {SCALE_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => setScale(option)}
                  aria-pressed={scale === option}
                  aria-label={`Scale to ${formatScaleLabel(option)}`}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    scale === option ? PILL_ACTIVE : PILL_IDLE
                  }`}
                >
                  {formatScaleLabel(option)}
                </button>
              ))}
            </div>
            {scale !== 1 && (
              <p className="text-xs text-amber-500 mb-3">
                Amounts scaled to {formatScaleLabel(scale)}
              </p>
            )}

            <ul className="space-y-1">
              {recipe.ingredients.map((ingredient, index) => {
                const done = checked.has(index)
                return (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="border-b border-amber-50 last:border-0"
                  >
                    <button
                      onClick={() => toggleIngredient(index)}
                      aria-pressed={done}
                      className={`w-full flex justify-between items-center gap-3 text-left py-2 transition-opacity duration-200 ${
                        done ? 'opacity-50' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          aria-hidden
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] leading-none transition-colors duration-200 ${
                            done
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'border-amber-300 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        <span className={`text-amber-800 ${done ? 'line-through' : ''}`}>
                          {ingredient.name}
                        </span>
                      </span>
                      <span
                        className={`text-amber-600 font-medium whitespace-nowrap ${
                          done ? 'line-through' : ''
                        }`}
                      >
                        {scaleAmount(ingredient.amount, scale)} {ingredient.unit}
                      </span>
                    </button>
                  </motion.li>
                )
              })}
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
              {recipe.steps.map((step, index) => {
                const done = completed.has(step.order)
                // Hoisted so the narrowing survives into the timer callbacks.
                const duration = step.duration
                return (
                  <motion.div
                    key={step.order}
                    id={`step-${step.order}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`bg-white rounded-xl p-4 shadow-md border transition-colors duration-200 cursor-pointer ${
                      done ? 'border-green-300 bg-green-50' : 'border-amber-100 hover:border-amber-300'
                    }`}
                    onClick={() => toggleStep(step.order)}
                  >
                    <div className="flex gap-4">
                      {/* Step number and icon */}
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            toggleStep(step.order)
                          }}
                          aria-pressed={done}
                          aria-label={`Mark step ${step.order} ${done ? 'not done' : 'done'}`}
                          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold transition-colors duration-200 ${
                            done ? 'bg-green-500 text-white' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {done ? '✓' : step.order}
                        </button>
                        {step.icon && (
                          <div className="mt-2">
                            <Suspense fallback={null}>
                              <LottieIcon icon={step.icon} size={32} playing={!done} />
                            </Suspense>
                          </div>
                        )}
                      </div>

                      {/* Step content */}
                      <div className="flex-grow min-w-0">
                        <p
                          className={`text-amber-800 leading-relaxed ${
                            done ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {step.instruction}
                        </p>
                        {duration ? (
                          <StepTimer
                            durationMin={duration}
                            timer={timers[step.order]}
                            onStart={() => start(step.order, duration)}
                            onPause={() => pause(step.order)}
                            onClear={() => clear(step.order)}
                          />
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Bake complete banner */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-6 bg-white rounded-xl p-6 shadow-md border border-amber-200 text-center"
              >
                <span className="text-4xl" aria-hidden>
                  🍞
                </span>
                <h2 className="font-display text-2xl font-bold text-amber-900 mt-2">
                  Fresh out of the oven!
                </h2>
                <p className="text-amber-700 mt-1">
                  That's a {recipe.name} done and dusted.
                </p>
                <button
                  onClick={resetProgress}
                  className="mt-4 px-6 py-3 bg-amber-600 text-white rounded-full font-medium hover:bg-amber-700 transition-colors shadow-md"
                >
                  Bake it again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
                {doneCount} / {totalSteps} steps
              </span>
            </div>
            <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${totalSteps > 0 ? (doneCount / totalSteps) * 100 : 0}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={resetProgress}
                className="text-sm text-amber-500 hover:text-amber-700 transition-colors"
              >
                Reset progress
              </button>
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

      {/* Floating timer pill */}
      <AnimatePresence>
        {nextTimer && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={() => scrollToStep(nextTimer.order)}
            className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-900 text-white shadow-lg font-medium"
          >
            <span aria-hidden>⏲</span>
            <span className="font-mono tabular-nums">{formatCountdown(nextTimer.remainingMs)}</span>
            <span className="text-amber-300" aria-hidden>
              ·
            </span>
            <span>Step {nextTimer.order}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {celebrating && <Celebration onDone={() => setCelebrating(false)} />}
    </div>
  )
}
