import { useCallback, useEffect, useRef, useState } from 'react'
import { playChime } from '../lib/sound'

export interface TimerState {
  status: 'running' | 'paused' | 'done'
  endsAt?: number
  remainingMs: number
  totalMs: number
}

export type TimerMap = Record<number, TimerState>

// Per-recipe step timers, persisted so a mid-proof page reload (or an hour
// away from the app) doesn't lose the countdown - endsAt is wall-clock.
export function useStepTimers(recipeId: string) {
  const key = `bready:timers:${recipeId}`

  const [timers, setTimers] = useState<TimerMap>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return {}
      const parsed = JSON.parse(raw) as TimerMap
      const now = Date.now()
      for (const t of Object.values(parsed)) {
        if (t.status === 'running' && t.endsAt !== undefined) {
          t.remainingMs = Math.max(0, t.endsAt - now)
          // Expired while we were away: mark done silently (no chime hours later)
          if (t.remainingMs === 0) t.status = 'done'
        }
      }
      return parsed
    } catch {
      return {}
    }
  })

  const timersRef = useRef(timers)
  useEffect(() => {
    timersRef.current = timers
    try {
      localStorage.setItem(key, JSON.stringify(timers))
    } catch {
      // storage unavailable - timers still run in memory
    }
  }, [key, timers])

  const anyRunning = Object.values(timers).some(t => t.status === 'running')

  useEffect(() => {
    if (!anyRunning) return
    const id = setInterval(() => {
      const now = Date.now()
      const current = timersRef.current
      let changed = false
      let finished = false
      const next: TimerMap = { ...current }
      for (const [order, t] of Object.entries(current)) {
        if (t.status !== 'running' || t.endsAt === undefined) continue
        const remaining = Math.max(0, t.endsAt - now)
        if (remaining === t.remainingMs) continue
        changed = true
        if (remaining === 0) {
          finished = true
          next[Number(order)] = { ...t, status: 'done', remainingMs: 0 }
        } else {
          next[Number(order)] = { ...t, remainingMs: remaining }
        }
      }
      if (finished) {
        playChime()
        navigator.vibrate?.([200, 100, 200])
      }
      if (changed) setTimers(next)
    }, 500)
    return () => clearInterval(id)
  }, [anyRunning])

  const start = useCallback((order: number, durationMin: number) => {
    setTimers(prev => {
      const existing = prev[order]
      const totalMs = durationMin * 60_000
      const remainingMs =
        existing?.status === 'paused' && existing.remainingMs > 0 ? existing.remainingMs : totalMs
      return {
        ...prev,
        [order]: { status: 'running', endsAt: Date.now() + remainingMs, remainingMs, totalMs },
      }
    })
  }, [])

  const pause = useCallback((order: number) => {
    setTimers(prev => {
      const t = prev[order]
      if (!t || t.status !== 'running') return prev
      return {
        ...prev,
        [order]: {
          ...t,
          status: 'paused',
          endsAt: undefined,
          remainingMs: Math.max(0, (t.endsAt ?? Date.now()) - Date.now()),
        },
      }
    })
  }, [])

  const clear = useCallback((order: number) => {
    setTimers(prev => {
      if (!(order in prev)) return prev
      const next = { ...prev }
      delete next[order]
      return next
    })
  }, [])

  const clearAll = useCallback(() => setTimers({}), [])

  return { timers, start, pause, clear, clearAll }
}

export function formatCountdown(ms: number): string {
  const total = Math.round(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
