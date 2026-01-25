import { Outlet, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { FlourParticles } from '../creative/FlourParticles'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/breads', label: 'Breads' },
  { to: '/recipes', label: 'Recipes' },
]

export function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background gradient layer */}
      <div className="fixed inset-0 bg-gradient-to-b from-amber-50 to-orange-50 z-0" />

      {/* Flour particles - above gradient, below content */}
      <FlourParticles density={70} />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-amber-50/80 border-b border-amber-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-1 sm:gap-2 shrink-0">
              <span className="text-2xl sm:text-3xl">🍞</span>
              <span className="text-lg sm:text-xl font-bold text-amber-900">Bready</span>
            </NavLink>

            {/* Nav links - compact on mobile */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-center px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all leading-none ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-amber-800 hover:bg-amber-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Page content with animations */}
      <main className="relative z-10 flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer - always at bottom */}
      <footer className="relative z-10 py-8 text-center text-amber-600 text-sm">
        <p>Made with 🍞 by Josh & Kai</p>
      </footer>
    </div>
  )
}
