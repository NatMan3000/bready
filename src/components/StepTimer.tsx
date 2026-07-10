import { motion } from 'framer-motion'
import { formatCountdown, type TimerState } from '../hooks/useStepTimers'

interface StepTimerProps {
  durationMin: number
  timer?: TimerState
  onStart: () => void
  onPause: () => void
  onClear: () => void
}

function stop(e: React.MouseEvent) {
  // The whole step card toggles completion on click - timer buttons must not.
  e.stopPropagation()
}

export function StepTimer({ durationMin, timer, onStart, onPause, onClear }: StepTimerProps) {
  if (!timer) {
    return (
      <button
        onClick={e => {
          stop(e)
          onStart()
        }}
        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
      >
        <span aria-hidden>⏲</span> Start {durationMin} min timer
      </button>
    )
  }

  if (timer.status === 'done') {
    return (
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="mt-3 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-500 text-white"
        onClick={stop}
        role="status"
      >
        <span className="font-semibold">⏰ Time's up!</span>
        <button
          onClick={e => {
            stop(e)
            onClear()
          }}
          className="px-3 py-1 rounded-full bg-white/25 hover:bg-white/35 text-sm font-medium transition-colors"
        >
          Dismiss
        </button>
      </motion.div>
    )
  }

  const pct = timer.totalMs > 0 ? 100 - (timer.remainingMs / timer.totalMs) * 100 : 0
  const running = timer.status === 'running'

  return (
    <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3" onClick={stop}>
      <div className="flex items-center justify-between gap-3">
        <span
          className={`font-mono text-lg font-semibold tabular-nums ${
            running ? 'text-amber-900' : 'text-amber-500'
          }`}
          aria-live="off"
        >
          {formatCountdown(timer.remainingMs)}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={e => {
              stop(e)
              if (running) onPause()
              else onStart()
            }}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            {running ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={e => {
              stop(e)
              onClear()
            }}
            className="px-3 py-1.5 rounded-full text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            aria-label="Cancel timer"
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-[width] duration-500 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
