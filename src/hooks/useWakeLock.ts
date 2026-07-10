import { useEffect, useRef, useState } from 'react'

// Keeps the screen on while `enabled` (dough doesn't care that your phone slept).
// Re-acquires after tab switches - the lock auto-releases when the page hides.
export function useWakeLock(enabled: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let cancelled = false

    const acquire = async () => {
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void sentinel.release()
          return
        }
        sentinelRef.current = sentinel
        setActive(true)
        sentinel.addEventListener('release', () => setActive(false))
      } catch {
        setActive(false)
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinelRef.current?.release()
      sentinelRef.current = null
      setActive(false)
    }
  }, [enabled])

  return {
    supported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    active,
  }
}
