import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, Link } from 'react-router-dom'
import { CATEGORY_LABELS, type BreadCategory, type Bread } from '../types'
import breadsData from '../data/breads.json'
import { useFavorites } from '../hooks/useFavorites'
import { FavoriteButton } from '../components/FavoriteButton'

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

const chipBase = 'px-4 py-2 rounded-full text-sm font-medium transition-all'
const chipActive = 'bg-amber-600 text-white'
const chipIdle = 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'

export function Breads() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') as BreadCategory | null

  const [query, setQuery] = useState('')
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const { favorites, isFavorite, toggleFavorite } = useFavorites()

  const search = query.trim().toLowerCase()

  const filteredBreads = useMemo(
    () =>
      breads.filter(bread => {
        if (activeCategory && bread.category !== activeCategory) return false
        if (favouritesOnly && !favorites.includes(bread.id)) return false
        if (!search) return true
        return (
          bread.name.toLowerCase().includes(search) ||
          bread.origin.toLowerCase().includes(search) ||
          bread.description.toLowerCase().includes(search)
        )
      }),
    [activeCategory, favouritesOnly, favorites, search]
  )

  const noFavouritesYet = favouritesOnly && favorites.length === 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-4xl font-bold text-amber-900 mb-2"
      >
        Bread Encyclopedia
      </motion.h1>
      <p className="text-amber-600 mb-6">Discover breads from around the world</p>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative w-full sm:max-w-md mb-4"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.6-3.6" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search breads..."
          aria-label="Search breads"
          className="h-11 w-full rounded-full border border-amber-200 bg-white pl-11 pr-12 text-amber-900 placeholder:text-amber-400 shadow-sm transition-colors focus:border-amber-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full text-amber-500 hover:text-amber-700"
          >
            ✕
          </button>
        )}
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        <button
          onClick={() => setSearchParams({})}
          className={`${chipBase} ${!activeCategory ? chipActive : chipIdle}`}
        >
          All
        </button>
        <button
          onClick={() => setFavouritesOnly(on => !on)}
          aria-pressed={favouritesOnly}
          className={`${chipBase} ${favouritesOnly ? chipActive : chipIdle}`}
        >
          ♥ Favourites
        </button>
        {categories.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSearchParams({ category: key })}
            className={`${chipBase} ${activeCategory === key ? chipActive : chipIdle}`}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {search && filteredBreads.length > 0 && (
        <p className="text-amber-600 text-sm mb-4">
          {filteredBreads.length} bread{filteredBreads.length === 1 ? '' : 's'} found
        </p>
      )}

      {/* Bread Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        key={`${activeCategory ?? 'all'}-${favouritesOnly}`}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredBreads.map((bread) => (
          <motion.div key={bread.id} variants={item}>
            <Link
              to={`/breads/${bread.id}`}
              className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 border border-amber-100"
            >
              {/* Bread image */}
              <div className="relative h-40 bg-gradient-to-br from-amber-100 to-amber-200 overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}images/${bread.id}.jpg`}
                  alt={bread.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <FavoriteButton
                  active={isFavorite(bread.id)}
                  onToggle={() => toggleFavorite(bread.id)}
                  className="absolute top-2 right-2"
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
        <div className="text-center text-amber-600 py-12">
          {noFavouritesYet ? (
            <p>No favourites yet. Tap the ♥ on any bread to keep it here.</p>
          ) : search ? (
            <>
              <p>No breads match "{query.trim()}".</p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-2 font-medium text-amber-700 underline underline-offset-4 hover:text-amber-900"
              >
                Clear search
              </button>
            </>
          ) : (
            <p>No breads found in this category yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
